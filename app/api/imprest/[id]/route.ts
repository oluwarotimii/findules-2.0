import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: Get single imprest
export async function GET(
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

        const imprest = await prisma.imprest.findUnique({
            where: { imprestNo: id },
            include: {
                issuer: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                retirer: {
                    select: {
                        name: true,
                        email: true
                    }
                },
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        if (!imprest) {
            return NextResponse.json({ error: 'Imprest not found' }, { status: 404 })
        }

        // Role-based access
        if (user.role !== 'MANAGER' && imprest.branchId !== user.branchId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json(imprest)

    } catch (error) {
        console.error('Error fetching imprest:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE: Delete imprest (admin only, not retired)
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
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Only managers can delete
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const { id } = await params

        const imprest = await prisma.imprest.findUnique({
            where: { imprestNo: id }
        })

        if (!imprest) {
            return NextResponse.json({ error: 'Imprest not found' }, { status: 404 })
        }

        // Cannot delete retired imprest
        if (imprest.status === 'RETIRED') {
            return NextResponse.json(
                { error: 'Cannot delete retired imprest' },
                { status: 400 }
            )
        }

        await prisma.imprest.delete({
            where: { imprestNo: id }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                id: user.id,
                action: 'DELETE_IMPREST',
                module: 'IMPREST',
                details: { imprestNo: id, staffName: imprest.staffName },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json({ message: 'Imprest deleted successfully' })

    } catch (error) {
        console.error('Error deleting imprest:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
