import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

const parseDecimal = (val: any) => new Prisma.Decimal(val || 0)

// GET: List all branch balances
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

        // Build query filters
        const where: any = {}

        // Role-based filtering
        if (user.role === 'BRANCH_ADMIN') {
            // Branch admin can only see their branch
            where.branchId = user.branchId
        } else if (user.role !== 'MANAGER') {
            // Staff cannot access this endpoint
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const branchBalances = await prisma.branchBalance.findMany({
            where,
            include: {
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true,
                        location: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(branchBalances)

    } catch (error) {
        console.error('Error fetching branch balances:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create or update branch opening balance (MANAGER only)
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

        // Only MANAGER can create/update branch balances
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 })
        }

        const body = await request.json()

        // Validation
        if (!body.branchId || body.amount === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: branchId, amount' },
                { status: 400 }
            )
        }

        // Convert amount to number and validate
        const amount = Number(body.amount);
        if (isNaN(amount) || amount < 0) {
            return NextResponse.json(
                { error: 'Amount must be a valid non-negative number' },
                { status: 400 }
            )
        }

        // Check if branch exists
        const branch = await prisma.branch.findUnique({
            where: { branchId: body.branchId }
        })

        if (!branch) {
            return NextResponse.json(
                { error: 'Branch not found' },
                { status: 404 }
            )
        }

        // Check if branch balance already exists
        const existingBalance = await prisma.branchBalance.findUnique({
            where: { branchId: body.branchId }
        })

        let branchBalance

        if (existingBalance) {
            // Update existing balance (top up)
            const balanceBefore = existingBalance.currentBalance
            const balanceAfter = balanceBefore.toNumber() + amount

            // Update the branch balance
            const updatedBalance = await prisma.branchBalance.update({
                where: { branchId: body.branchId },
                data: {
                    currentBalance: parseDecimal(balanceAfter),
                    openingBalance: parseDecimal(existingBalance.openingBalance.toNumber() + amount)
                },
                include: {
                    branch: {
                        select: {
                            branchName: true,
                            branchCode: true
                        }
                    }
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
                    performedBy: user.userId,
                    notes: body.notes || 'Balance top up by manager'
                }
            })

            branchBalance = updatedBalance
        } else {
            // Create new branch balance
            const newBranchBalance = await prisma.branchBalance.create({
                data: {
                    branchId: body.branchId,
                    openingBalance: parseDecimal(amount),
                    currentBalance: parseDecimal(amount)
                },
                include: {
                    branch: {
                        select: {
                            branchName: true,
                            branchCode: true
                        }
                    }
                }
            })

            // Create transaction record
            await prisma.branchBalanceTransaction.create({
                data: {
                    branchBalanceId: newBranchBalance.id,
                    transactionType: 'OPENING_BALANCE',
                    amount: parseDecimal(amount),
                    balanceBefore: parseDecimal(0),
                    balanceAfter: parseDecimal(amount),
                    performedBy: user.userId,
                    notes: body.notes || 'Initial opening balance'
                }
            })

            // Use the created branch balance directly
            branchBalance = newBranchBalance
        }

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: existingBalance ? 'TOP_UP_BRANCH_BALANCE' : 'CREATE_BRANCH_BALANCE',
                module: 'BRANCH_BALANCE',
                details: {
                    branchId: body.branchId,
                    amount: body.amount.toString(),
                    branchName: branch.branchName
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(branchBalance)

    } catch (error) {
        console.error('Error creating/updating branch balance:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
