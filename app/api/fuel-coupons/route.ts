import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateFuelCouponCode } from '@/lib/utils'

// GET: List fuel coupons
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const fuelType = searchParams.get('fuelType')
        const staffName = searchParams.get('staffName')
        const plateNumber = searchParams.get('plateNumber')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build query filters
        const where: any = {}

        // Role-based filtering
        if (user.role !== 'MANAGER') {
            if (user.branchId) {
                where.branchId = user.branchId
            }
        }

        // Fuel type filter
        if (fuelType && fuelType !== 'ALL') {
            where.fuelType = fuelType
        }

        // Staff name filter
        if (staffName) {
            where.staffName = {
                contains: staffName
            }
        }

        // Plate number filter
        if (plateNumber) {
            where.plateNumber = {
                contains: plateNumber
            }
        }

        // Date range filter
        if (startDate || endDate) {
            where.date = {}
            if (startDate) {
                where.date.gte = new Date(startDate)
            }
            if (endDate) {
                where.date.lte = new Date(endDate)
            }
        }

        const fuelCoupons = await prisma.fuelCoupon.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
            include: {
                creator: {
                    select: {
                        name: true
                    }
                },
                branch: {
                    select: {
                        branchName: true
                    }
                }
            }
        })

        return NextResponse.json(fuelCoupons)

    } catch (error) {
        console.error('Error fetching fuel coupons:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create new fuel coupon
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const body = await request.json()

        // Validation
        if (!body.staffName || !body.department || !body.fuelType || !body.quantityLitres) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (body.quantityLitres <= 0) {
            return NextResponse.json(
                { error: 'Quantity must be greater than 0' },
                { status: 400 }
            )
        }

        // Generate document code
        const count = await prisma.fuelCoupon.count()
        const documentCode = generateFuelCouponCode(count)

        const fuelCoupon = await prisma.fuelCoupon.create({
            data: {
                documentCode,
                date: body.date ? new Date(body.date) : new Date(),
                staffName: body.staffName,
                department: body.department,
                unit: body.unit,
                vehicleType: body.vehicleType,
                plateNumber: body.plateNumber,
                purpose: body.purpose,
                fuelType: body.fuelType,
                quantityLitres: body.quantityLitres,
                estimatedAmount: body.estimatedAmount || 0,
                createdBy: user.userId,
                branchId: user.branchId
            },
            include: {
                creator: {
                    select: {
                        name: true
                    }
                },
                branch: {
                    select: {
                        branchName: true
                    }
                }
            }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'CREATE_FUEL_COUPON',
                module: 'FUEL_COUPON',
                details: { documentCode: fuelCoupon.documentCode, staffName: fuelCoupon.staffName },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(fuelCoupon)

    } catch (error) {
        console.error('Error creating fuel coupon:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
