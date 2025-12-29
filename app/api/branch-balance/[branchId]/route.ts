import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

const parseDecimal = (val: any) => new Prisma.Decimal(val || 0)

// GET: Get specific branch balance details
export async function GET(
    request: NextRequest,
    { params }: { params: { branchId: string } }
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

        const { branchId } = params

        // Role-based access control
        if (user.role === 'BRANCH_ADMIN' && user.branchId !== branchId) {
            return NextResponse.json({ error: 'Forbidden - Access denied' }, { status: 403 })
        } else if (user.role === 'STAFF') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const branchBalance = await prisma.branchBalance.findUnique({
            where: { branchId },
            include: {
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true,
                        location: true
                    }
                },
                transactions: {
                    take: 10,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if (!branchBalance) {
            return NextResponse.json(
                { error: 'Branch balance not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(branchBalance)

    } catch (error) {
        console.error('Error fetching branch balance:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT: Update branch balance (top up) - MANAGER only
export async function PUT(
    request: NextRequest,
    { params }: { params: { branchId: string } }
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

        // Only MANAGER can update branch balances
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 })
        }

        const { branchId } = params
        const body = await request.json()

        // Validation
        if (body.amount === undefined) {
            return NextResponse.json(
                { error: 'Missing required field: amount' },
                { status: 400 }
            )
        }

        // Convert amount to number and validate
        const amount = Number(body.amount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be a valid positive number' },
                { status: 400 }
            )
        }

        // Get existing balance
        const existingBalance = await prisma.branchBalance.findUnique({
            where: { branchId }
        })

        if (!existingBalance) {
            return NextResponse.json(
                { error: 'Branch balance not found' },
                { status: 404 }
            )
        }

        const balanceBefore = existingBalance.currentBalance
        const balanceAfter = balanceBefore.toNumber() + amount

        // Update balance
        await prisma.branchBalance.update({
            where: { branchId },
            data: {
                currentBalance: parseDecimal(balanceAfter),
                openingBalance: parseDecimal(existingBalance.openingBalance.toNumber() + amount)
            }
        })

        // Fetch the updated branch balance with branch details
        const branchBalance = await prisma.branchBalance.findUnique({
            where: { branchId },
            include: {
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        if (!branchBalance) {
            return NextResponse.json(
                { error: 'Error updating branch balance' },
                { status: 500 }
            )
        }

        // Create transaction record
        await prisma.branchBalanceTransaction.create({
            data: {
                branchBalanceId: existingBalance.id,
                transactionType: 'TOP_UP',
                amount: parseDecimal(amount),
                balanceBefore: balanceBefore,
                balanceAfter: parseDecimal(balanceAfter),
                performedBy: user.userId,
                notes: body.notes || 'Balance top up by manager'
            }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'TOP_UP_BRANCH_BALANCE',
                module: 'BRANCH_BALANCE',
                details: {
                    branchId,
                    amount: amount.toString(),
                    balanceBefore: balanceBefore.toString(),
                    balanceAfter: balanceAfter.toString()
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(branchBalance)

    } catch (error) {
        console.error('Error updating branch balance:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
