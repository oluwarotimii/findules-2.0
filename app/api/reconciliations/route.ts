import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { generateReconciliationNumber, calculateVarianceCategory } from '@/lib/utils'
import { Prisma, VarianceCategory } from '@prisma/client'

// GET: List reconciliations
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
        const date = searchParams.get('date')
        const branchId = searchParams.get('branchId')

        // Build query filters
        const where: any = {}

        // Role-based filtering
        if (user.role !== 'MANAGER') {
            // Staff can only see their own reconciliations?
            // Wait, if Cashiers don't log in, then the "Staff" (Accountant) creates reconciliations for them.
            // So the Accountant should see reconciliations they created? Or all?
            // Usually Accountant needs to see all.
            // If the user is STAFF (Accountant), they might want to see all or just theirs.
            // Let's assume STAFF can see all for now, or filter by branch.
            // But previously: where.cashierId = user.id. This is now invalid.
            // Let's allow seeing all for now, maybe filtered by branch if they are assigned to a branch.
            if (user.branchId) {
                where.branchId = user.branchId
            }
        } else {
            // Managers can see all, optionally filtered by branch
            if (branchId) {
                where.branchId = branchId
            }
        }

        // Date filter
        if (date) {
            where.date = new Date(date)
        }

        const reconciliations = await prisma.reconciliation.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
            include: {
                cashier: {
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

        return NextResponse.json(reconciliations)

    } catch (error) {
        console.error('Error fetching reconciliations:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create reconciliation
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

        // Validate Cashier
        if (!body.cashierId) {
            return NextResponse.json({ error: 'Cashier is required' }, { status: 400 })
        }

        const cashier = await prisma.cashier.findUnique({
            where: { id: body.cashierId }
        })

        if (!cashier) {
            return NextResponse.json({ error: 'Invalid cashier selected' }, { status: 400 })
        }

        // Generate Serial Number
        const count = await prisma.reconciliation.count()
        const serialNumber = generateReconciliationNumber(count)

        // Parse numeric fields to ensure they are valid decimals
        const parseDecimal = (val: any) => new Prisma.Decimal(val || 0)

        const actualOpeningBalance = parseDecimal(body.actualOpeningBalance)
        const totalSales = parseDecimal(body.totalSales) // Stored in actualTotalSales

        // Cashier Record Breakdown Items
        const posTransactionsAmount = parseDecimal(body.posTransactionsAmount)
        const transfersIn = parseDecimal(body.transfersIn)
        const transfersOut = parseDecimal(body.transfersOut)
        const discountsGiven = parseDecimal(body.discountsGiven)
        const refundsIssued = parseDecimal(body.refundsIssued)

        // Withdrawals
        const cashWithdrawn = parseDecimal(body.cashWithdrawn)

        // Physical Count
        const cashAtHand = parseDecimal(body.cashAtHand) // Stored in actualClosingBalance

        // 1. Turnover = Opening Balance + Total Sales
        const turnover = actualOpeningBalance.add(totalSales)

        // 2. Expected Closing Balance = Turnover - ALL Cashier Record Breakdown Items - Withdrawals
        const expectedClosingBalance = turnover
            .sub(posTransactionsAmount)
            .sub(transfersIn)
            .sub(transfersOut)
            .sub(discountsGiven)
            .sub(refundsIssued)
            .sub(cashWithdrawn)

        // 3. Variance = Cash at Hand - Expected Closing
        const overageShortage = cashAtHand.sub(expectedClosingBalance)

        // Determine Variance Category
        const varianceCategory = calculateVarianceCategory(overageShortage.toNumber()) as VarianceCategory

        // Verify that the user exists before creating the reconciliation
        const verifiedUser = await prisma.user.findUnique({
            where: { id: user.id }
        })

        if (!verifiedUser) {
            return NextResponse.json(
                { error: 'User not found. Please log in again.' },
                { status: 401 }
            )
        }

        const reconciliation = await prisma.reconciliation.create({
            data: {
                serialNumber,
                date: new Date(body.date),
                cashierId: cashier.id,
                cashierName: cashier.name,
                branchId: cashier.branchId,

                actualOpeningBalance,

                // Sales
                actualTotalSales: totalSales, // Storing totalSales here

                // Breakdown
                posTransactionsAmount,
                transfersIn,
                transfersOut,
                discountsGiven,
                refundsIssued,

                turnOver: turnover,

                // Withdrawals
                cashWithdrawn,
                withdrawalRecipient: body.withdrawalRecipient,
                withdrawalDetails: body.withdrawalDetails,

                // Bank Deposit
                tellerNo: body.tellerNo,
                bankName: body.bankName,
                branchLocation: body.branchLocation,
                depositSlipNo: body.depositSlipNo,
                depositSlipUpload: body.depositSlipUpload,

                // Closing
                expectedClosingBalance,
                actualClosingBalance: cashAtHand, // Storing cashAtHand here

                overageShortage,
                varianceCategory,

                remarks: body.remarks,

                submittedBy: user.id,
                createdByIp: request.headers.get('x-forwarded-for') || 'unknown',
            }
        })

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'CREATE_RECONCILIATION',
                    module: 'RECONCILIATION',
                    details: { reconciliationId: reconciliation.serialNumber, cashierName: cashier.name },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the reconciliation creation if audit log creation fails
        }

        return NextResponse.json(reconciliation)

    } catch (error) {
        console.error('Error creating reconciliation:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
