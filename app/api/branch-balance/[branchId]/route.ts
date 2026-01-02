import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

const parseDecimal = (val: any) => new Prisma.Decimal(val || 0)

// GET: Get specific branch balance details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ branchId: string }> }
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

        const { branchId } = await params

        // Role-based access control
        if (user.role === 'BRANCH_ADMIN' && user.branchId !== branchId) {
            return NextResponse.json({ error: 'Forbidden - Access denied' }, { status: 403 })
        } else if (user.role === 'STAFF') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Extract query parameters for pagination of transactions
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');

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
                    take: limit,
                    skip: (page - 1) * limit,
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

        // Get total transaction count for pagination info
        const transactionCount = await prisma.branchBalanceTransaction.count({
            where: { branchBalanceId: branchBalance.id }
        });

        return NextResponse.json({
            ...branchBalance,
            transactions: {
                data: branchBalance.transactions,
                pagination: {
                    page,
                    limit,
                    totalCount: transactionCount,
                    totalPages: Math.ceil(transactionCount / limit)
                }
            }
        })

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
    { params }: { params: Promise<{ branchId: string }> }
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

        const { branchId } = await params
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

        // Verify that the user exists before updating the branch balance
        const verifiedUser = await prisma.user.findUnique({
            where: { id: user.id }
        })

        if (!verifiedUser) {
            return NextResponse.json(
                { error: 'User not found. Please log in again.' },
                { status: 401 }
            )
        }

        // Update balance
        const updatedBalance = await prisma.branchBalance.update({
            where: { branchId },
            data: {
                currentBalance: parseDecimal(balanceAfter),
                openingBalance: parseDecimal(existingBalance.openingBalance.toNumber() + amount),
                lastUpdated: new Date(),
            }
        })

        // Create transaction record
        await prisma.branchBalanceTransaction.create({
            data: {
                branchBalanceId: existingBalance.id,
                transactionType: 'TOP_UP',
                amount: parseDecimal(amount),
                balanceBefore: balanceBefore,
                balanceAfter: parseDecimal(balanceAfter),
                performedBy: user.id,
                notes: body.notes || 'Balance top up by manager'
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

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
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
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the branch balance update if audit log creation fails
        }

        return NextResponse.json(branchBalance)

    } catch (error) {
        console.error('Error updating branch balance:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
