import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ serialNumber: string }> }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '')
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Await params in Next.js 16
        const { serialNumber } = await params

        // Find the reconciliation
        const reconciliation = await prisma.reconciliation.findUnique({
            where: { serialNumber }
        })

        if (!reconciliation) {
            return NextResponse.json(
                { error: 'Reconciliation not found' },
                { status: 404 }
            )
        }

        // Update status to RETIRED
        const updated = await prisma.reconciliation.update({
            where: { serialNumber },
            data: {
                status: 'RETIRED',
                updatedAt: new Date()
            }
        })

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: payload.userId,
                action: 'retire_reconciliation',
                module: 'reconciliations',
                details: {
                    serialNumber,
                    previousStatus: reconciliation.status,
                    newStatus: 'RETIRED'
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json({
            success: true,
            reconciliation: updated
        })
    } catch (error) {
        console.error('Error retiring reconciliation:', error)
        return NextResponse.json(
            { error: 'Failed to retire reconciliation' },
            { status: 500 }
        )
    }
}
