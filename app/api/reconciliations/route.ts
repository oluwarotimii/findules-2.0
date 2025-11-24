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

        const expectedOpeningBalance = parseDecimal(body.expectedOpeningBalance)
        const actualOpeningBalance = parseDecimal(body.actualOpeningBalance)
        const openingVariance = actualOpeningBalance.sub(expectedOpeningBalance)

        const cashSales = parseDecimal(body.cashSales)
        const posTransactionsAmount = parseDecimal(body.posTransactionsAmount)
        const actualTotalSales = cashSales.add(posTransactionsAmount)

        // Note: expectedTotalSales is usually provided or calculated from system records. 
        // Here we take it from input, but in a real system it might come from a sales API.
        const expectedTotalSales = parseDecimal(body.expectedTotalSales)

        const cashWithdrawn = parseDecimal(body.cashWithdrawn)
        const transfersOut = parseDecimal(body.transfersOut)
        const discountsGiven = parseDecimal(body.discountsGiven)
        const refundsIssued = parseDecimal(body.refundsIssued)

        const actualClosingBalance = parseDecimal(body.actualClosingBalance)

        // Calculate Expected Closing Balance
        // Formula: Actual Opening + Cash Sales - Cash Withdrawn - Transfers Out
        // (POS sales go to bank, so they don't affect cash in hand closing balance, 
        // unless 'actualTotalSales' implies all cash. Assuming 'cashSales' is the cash component)
        const expectedClosingBalance = actualOpeningBalance
            .add(cashSales)
            .sub(cashWithdrawn)
            .sub(transfersOut)

        // Calculate Overage/Shortage
        const overageShortage = actualClosingBalance.sub(expectedClosingBalance)

        // Determine Variance Category
        const varianceCategory = calculateVarianceCategory(overageShortage.toNumber()) as VarianceCategory

        const reconciliation = await prisma.reconciliation.create({
            data: {
                serialNumber,
                date: new Date(body.date),
                cashierId: cashier.id,
                cashierName: cashier.name,
                branchId: cashier.branchId, // Use cashier's branch

                expectedOpeningBalance,
                actualOpeningBalance,
                openingVariance,
                openingVarianceExplanation: body.openingVarianceExplanation,

                expectedTotalSales,
                actualTotalSales,
                posTransactionsAmount,
                cashSales,

                discountsGiven,
                refundsIssued,

                turnOver: actualTotalSales, // Assuming turnover is total sales
                cashWithdrawn,
                withdrawalDetails: body.withdrawalDetails,

                tellerNo: body.tellerNo,
                bankName: body.bankName,
                branchLocation: body.branchLocation,
                depositSlipNo: body.depositSlipNo,
                depositSlipUpload: body.depositSlipUpload,

                transfersOut,
                transferDetails: body.transferDetails,

                expectedClosingBalance,
                actualClosingBalance,

                overageShortage,
                varianceCategory,


                remarks: body.remarks,

                submittedBy: user.userId, // The Accountant/User who submitted it
                // Audit
                createdByIp: request.headers.get('x-forwarded-for') || 'unknown',
            }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'CREATE_RECONCILIATION',
                module: 'RECONCILIATION',
                details: { reconciliationId: reconciliation.serialNumber, cashierName: cashier.name },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(reconciliation)

    } catch (error) {
        console.error('Error creating reconciliation:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
