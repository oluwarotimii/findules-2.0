import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateImprestNumber } from '@/lib/utils'
import { ImprestCategory } from '@prisma/client'

// GET: List imprest records
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
        const status = searchParams.get('status')
        const staffName = searchParams.get('staffName')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build query filters
        const where: any = {}

        // Role-based filtering
        if (user.role !== 'MANAGER') {
            // Staff can only see their branch
            if (user.branchId) {
                where.branchId = user.branchId
            }
        }

        // Status filter
        if (status && status !== 'ALL') {
            where.status = status
        }

        // Staff name filter
        if (staffName) {
            where.staffName = {
                contains: staffName
            }
        }

        // Date range filter
        if (startDate || endDate) {
            where.dateIssued = {}
            if (startDate) {
                where.dateIssued.gte = new Date(startDate)
            }
            if (endDate) {
                where.dateIssued.lte = new Date(endDate)
            }
        }

        const imprest = await prisma.imprest.findMany({
            where,
            orderBy: {
                dateIssued: 'desc',
            },
            include: {
                issuer: {
                    select: {
                        name: true
                    }
                },
                retirer: {
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

        return NextResponse.json(imprest)

    } catch (error) {
        console.error('Error fetching imprest:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create new imprest
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
        if (!body.staffName || !body.amount || !body.category || !body.purpose) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (body.amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            )
        }

        // Generate imprest number
        const count = await prisma.imprest.count()
        const imprestNo = generateImprestNumber(count)

        const imprest = await prisma.imprest.create({
            data: {
                imprestNo,
                staffName: body.staffName,
                amount: body.amount,
                category: body.category as ImprestCategory,
                purpose: body.purpose,
                dateIssued: body.dateIssued ? new Date(body.dateIssued) : new Date(),
                issuedBy: user.userId,
                branchId: user.branchId,
                status: 'ISSUED'
            },
            include: {
                issuer: {
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
                action: 'CREATE_IMPREST',
                module: 'IMPREST',
                details: { imprestNo: imprest.imprestNo, staffName: imprest.staffName, amount: imprest.amount.toString() },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(imprest)

    } catch (error) {
        console.error('Error creating imprest:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
