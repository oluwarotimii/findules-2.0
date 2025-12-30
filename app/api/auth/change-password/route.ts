import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, hashPassword } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
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
        const { currentPassword, newPassword } = body

        // Validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'New password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Get the user from the database to verify current password
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        })

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash)
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            )
        }

        // Hash the new password
        const newHashedPassword = await hashPassword(newPassword)

        // Update the password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHashedPassword }
        })

        // Log the password change
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'CHANGE_PASSWORD',
                    module: 'AUTH',
                    details: {
                        timestamp: new Date().toISOString(),
                        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the password change if audit log creation fails
        }

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully'
        })

    } catch (error) {
        console.error('Error changing password:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}