import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// DELETE: Deactivate cashier
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized. Managers only.' }, { status: 403 })
        }

        const { id } = await params

        // Check if cashier exists
        const cashier = await prisma.cashier.findUnique({
            where: { id }
        })

        if (!cashier) {
            return NextResponse.json({ error: 'Cashier not found' }, { status: 404 })
        }

        // Deactivate
        const updatedCashier = await prisma.cashier.update({
            where: { id },
            data: { status: 'INACTIVE' }
        })

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'DEACTIVATE_CASHIER',
                    module: 'USER_MANAGEMENT',
                    details: { cashierId: id, name: cashier.name },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the cashier deactivation if audit log creation fails
        }

        return NextResponse.json(updatedCashier)

    } catch (error) {
        console.error('Error deleting cashier:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
