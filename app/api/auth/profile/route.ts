import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix

        // Verify token
        const payload = verifyToken(token)

        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Get the user from the database to verify they exist
        const dbUser = await prisma.user.findUnique({
            where: { id: payload.id }
        })

        if (!dbUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = {}

        if (body.name) updateData.name = body.name
        // STAFF users can only update their name, not their role or branch
        // Role and branch updates are restricted to managers

        // Update the user
        const updatedUser = await prisma.user.update({
            where: { id: payload.id },
            data: updateData,
            include: { branch: true }
        })

        // Log the profile update
        try {
            await prisma.auditLog.create({
                data: {
                    userId: payload.id,
                    action: 'UPDATE_PROFILE',
                    module: 'USER_PROFILE',
                    details: {
                        updatedFields: Object.keys(updateData),
                        timestamp: new Date().toISOString(),
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the profile update if audit log creation fails
        }

        // Return updated user data
        return NextResponse.json({
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                branchId: updatedUser.branchId,
                branchName: updatedUser.branch.branchName,
            },
        })
    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json(
            { error: 'An error occurred during profile update' },
            { status: 500 }
        )
    }
}