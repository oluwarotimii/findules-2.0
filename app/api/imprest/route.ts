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

        // Check branch balance
        const branchBalance = await prisma.branchBalance.findUnique({
            where: { branchId: user.branchId }
        })

        if (!branchBalance) {
            return NextResponse.json(
                { error: 'Branch balance not initialized. Please contact administrator.' },
                { status: 400 }
            )
        }

        // Check if sufficient balance
        if (branchBalance.currentBalance.toNumber() < body.amount) {
            return NextResponse.json(
                {
                    error: 'Insufficient branch balance',
                    availableBalance: branchBalance.currentBalance.toString(),
                    requestedAmount: body.amount.toString()
                },
                { status: 400 }
            )
        }

        // Verify that the user exists before creating the imprest
        const verifiedUser = await prisma.user.findUnique({
            where: { id: user.id }
        })

        if (!verifiedUser) {
            return NextResponse.json(
                { error: 'User not found. Please log in again.' },
                { status: 401 }
            )
        }

        // Generate imprest number
        const count = await prisma.imprest.count()
        const imprestNo = generateImprestNumber(count)

        // Create imprest and update branch balance in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create imprest
            const imprest = await tx.imprest.create({
                data: {
                    imprestNo,
                    staffName: body.staffName,
                    amount: body.amount,
                    category: body.category as ImprestCategory,
                    purpose: body.purpose,
                    dateIssued: body.dateIssued ? new Date(body.dateIssued) : new Date(),
                    issuedBy: user.id,
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

            // Update branch balance
            const balanceBefore = branchBalance.currentBalance
            const balanceAfter = balanceBefore.toNumber() - Number(body.amount)

            const updatedBranchBalance = await tx.branchBalance.update({
                where: { branchId: user.branchId },
                data: {
                    currentBalance: balanceAfter,
                    totalIssued: branchBalance.totalIssued.toNumber() + Number(body.amount)
                }
            })

            // Create balance transaction record
            await tx.branchBalanceTransaction.create({
                data: {
                    branchBalanceId: branchBalance.id,
                    transactionType: 'IMPREST_ISSUED',
                    amount: body.amount,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    reference: imprestNo,
                    performedBy: user.id,
                    notes: `Imprest issued to ${body.staffName}`
                }
            })

            return { imprest, updatedBranchBalance }
        })

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'CREATE_IMPREST',
                    module: 'IMPREST',
                    details: {
                        imprestNo: result.imprest.imprestNo,
                        staffName: result.imprest.staffName,
                        amount: result.imprest.amount.toString(),
                        branchBalance: result.updatedBranchBalance.currentBalance.toString()
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the imprest creation if audit log creation fails
        }

        return NextResponse.json(result.imprest)

    } catch (error) {
        console.error('Error creating imprest:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
