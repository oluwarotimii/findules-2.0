import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Fetch previous day's closing balance for a cashier
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
        const cashierId = searchParams.get('cashierId')
        const date = searchParams.get('date')

        if (!cashierId || !date) {
            return NextResponse.json(
                { error: 'cashierId and date are required' },
                { status: 400 }
            )
        }

        // Find the most recent reconciliation for this cashier before the given date
        const previousReconciliation = await prisma.reconciliation.findFirst({
            where: {
                cashierId: cashierId,
                date: {
                    lt: new Date(date) // Less than the current date
                }
            },
            orderBy: {
                date: 'desc' // Most recent first
            },
            select: {
                date: true,
                actualClosingBalance: true,
                serialNumber: true
            }
        })

        if (!previousReconciliation) {
            return NextResponse.json({
                hasHistory: false,
                previousClosingBalance: null,
                message: 'No previous reconciliation found for this cashier'
            })
        }

        return NextResponse.json({
            hasHistory: true,
            previousClosingBalance: previousReconciliation.actualClosingBalance.toNumber(),
            previousDate: previousReconciliation.date,
            previousSerialNumber: previousReconciliation.serialNumber
        })

    } catch (error) {
        console.error('Error fetching previous balance:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
