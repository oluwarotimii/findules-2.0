import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Get transaction history for a branch balance
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

        // Get branch balance
        const branchBalance = await prisma.branchBalance.findUnique({
            where: { branchId }
        })

        if (!branchBalance) {
            return NextResponse.json(
                { error: 'Branch balance not found' },
                { status: 404 }
            )
        }

        // Get transactions
        const transactions = await prisma.branchBalanceTransaction.findMany({
            where: {
                branchBalanceId: branchBalance.id
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(transactions)

    } catch (error) {
        console.error('Error fetching branch balance transactions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
