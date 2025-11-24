import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params
        const body = await request.json()

        // Get the imprest
        const imprest = await prisma.imprest.findUnique({
            where: { imprestNo: id }
        })

        if (!imprest) {
            return NextResponse.json({ error: 'Imprest not found' }, { status: 404 })
        }

        // Validate status
        if (imprest.status === 'RETIRED') {
            return NextResponse.json(
                { error: 'Imprest already retired' },
                { status: 400 }
            )
        }

        // Validation
        if (body.amountSpent === undefined || body.amountSpent === null) {
            return NextResponse.json(
                { error: 'Amount spent is required' },
                { status: 400 }
            )
        }

        const amountSpent = new Prisma.Decimal(body.amountSpent)
        const amount = new Prisma.Decimal(imprest.amount)

        // Validate amount spent
        if (amountSpent.lessThan(0)) {
            return NextResponse.json(
                { error: 'Amount spent cannot be negative' },
                { status: 400 }
            )
        }

        if (amountSpent.greaterThan(amount)) {
            return NextResponse.json(
                { error: 'Amount spent cannot exceed amount issued' },
                { status: 400 }
            )
        }

        // Calculate balance
        const balance = amount.sub(amountSpent)

        // Update imprest
        const updatedImprest = await prisma.imprest.update({
            where: { imprestNo: id },
            data: {
                status: 'RETIRED',
                dateRetired: body.dateRetired ? new Date(body.dateRetired) : new Date(),
                amountSpent,
                balance,
                receipts: body.receipts,
                retirementNotes: body.retirementNotes,
                retiredBy: user.userId
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

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'RETIRE_IMPREST',
                module: 'IMPREST',
                details: {
                    imprestNo: updatedImprest.imprestNo,
                    staffName: updatedImprest.staffName,
                    amountSpent: amountSpent.toString(),
                    balance: balance.toString()
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(updatedImprest)

    } catch (error) {
        console.error('Error retiring imprest:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
