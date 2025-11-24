import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Get single fuel coupon
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const { id } = await params

        const fuelCoupon = await prisma.fuelCoupon.findUnique({
            where: { documentCode: id },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        if (!fuelCoupon) {
            return NextResponse.json({ error: 'Fuel coupon not found' }, { status: 404 })
        }

        // Role-based access
        if (user.role !== 'MANAGER' && fuelCoupon.branchId !== user.branchId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json(fuelCoupon)

    } catch (error) {
        console.error('Error fetching fuel coupon:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE: Delete fuel coupon (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Only managers can delete
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const { id } = await params

        const fuelCoupon = await prisma.fuelCoupon.findUnique({
            where: { documentCode: id }
        })

        if (!fuelCoupon) {
            return NextResponse.json({ error: 'Fuel coupon not found' }, { status: 404 })
        }

        await prisma.fuelCoupon.delete({
            where: { documentCode: id }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'DELETE_FUEL_COUPON',
                module: 'FUEL_COUPON',
                details: { documentCode: id, staffName: fuelCoupon.staffName },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json({ message: 'Fuel coupon deleted successfully' })

    } catch (error) {
        console.error('Error deleting fuel coupon:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
