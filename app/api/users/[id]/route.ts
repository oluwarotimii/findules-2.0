import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET: Get specific user
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        // Only managers can view users
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = params

        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(targetUser)

    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT: Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        // Only managers can update users
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = params
        const body = await request.json()

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Prepare update data
        const updateData: any = {}

        if (body.name) updateData.name = body.name
        if (body.role) {
            const validRoles = ['STAFF', 'BRANCH_ADMIN', 'MANAGER']
            if (!validRoles.includes(body.role)) {
                return NextResponse.json(
                    { error: 'Invalid role' },
                    { status: 400 }
                )
            }
            updateData.role = body.role
        }
        if (body.branchId) {
            // Verify branch exists
            const branch = await prisma.branch.findUnique({
                where: { branchId: body.branchId }
            })
            if (!branch) {
                return NextResponse.json(
                    { error: 'Branch not found' },
                    { status: 404 }
                )
            }
            updateData.branchId = body.branchId
        }
        if (body.status) updateData.status = body.status
        if (body.password) {
            if (body.password.length < 6) {
                return NextResponse.json(
                    { error: 'Password must be at least 6 characters' },
                    { status: 400 }
                )
            }
            updateData.passwordHash = await bcrypt.hash(body.password, 10)
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                status: true,
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'UPDATE_USER',
                    module: 'USER_MANAGEMENT',
                    details: {
                        targetUserId: id,
                        changes: updateData
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the user update if audit log creation fails
        }

        return NextResponse.json(updatedUser)

    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE: Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        // Only managers can delete users
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = params

        // Cannot delete self
        if (id === user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            )
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        })

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Delete user
        await prisma.user.delete({
            where: { id }
        })

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'DELETE_USER',
                    module: 'USER_MANAGEMENT',
                    details: {
                        deletedUserId: id,
                        name: existingUser.name,
                        email: existingUser.email
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the user deletion if audit log creation fails
        }

        return NextResponse.json({ message: 'User deleted successfully' })

    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
