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

        // Verify that the user exists in the database
        const verifiedUser = await prisma.user.findUnique({
            where: { id: user.id }
        })

        if (!verifiedUser) {
            return NextResponse.json(
                { error: 'User not found. Please log in again.' },
                { status: 401 }
            )
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

        // Check if branch balance already exists before upsert to determine transaction type
        const existingBalance = await prisma.branchBalance.findUnique({
            where: { branchId: body.branchId }
        });

        // Use upsert to handle both creation and update in one atomic operation
        const upsertResult = await prisma.branchBalance.upsert({
            where: { 
                branchId: body.branchId 
            },
            update: {
                currentBalance: { increment: parseDecimal(amount) },
                openingBalance: { increment: parseDecimal(amount) },
                lastUpdated: new Date(),
            },
            create: {
                branchId: body.branchId,
                openingBalance: parseDecimal(amount),
                currentBalance: parseDecimal(amount),
                totalIssued: 0,
                totalRetired: 0,
                lastUpdated: new Date(),
            },
        });

        // Determine transaction details based on whether it was an update or creation
        const balanceBefore = existingBalance ? existingBalance.currentBalance.toNumber() : 0;
        const balanceAfter = balanceBefore + amount;
        const transactionType = existingBalance ? 'TOP_UP' : 'OPENING_BALANCE';
        const notes = body.notes || (existingBalance ? 'Balance top up by manager' : 'Initial opening balance');

        // Create transaction record
        await prisma.branchBalanceTransaction.create({
            data: {
                branchBalanceId: upsertResult.id,
                transactionType: transactionType,
                amount: parseDecimal(amount),
                balanceBefore: parseDecimal(balanceBefore),
                balanceAfter: parseDecimal(balanceAfter),
                performedBy: user.id,
                notes: notes
            }
        });

        // Fetch the final branch balance with branch details
        const branchBalance = await prisma.branchBalance.findUnique({
            where: { branchId: body.branchId },
            include: {
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        });

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
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
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the branch balance operation if audit log creation fails
        }

        return NextResponse.json(branchBalance)

    } catch (error) {
        console.error('Error creating/updating branch balance:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}