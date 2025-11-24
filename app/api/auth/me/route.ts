import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { branch: true },
        })

        if (!user || user.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'User not found or inactive' },
                { status: 401 }
            )
        }

        // Return user data
        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
                branchName: user.branch.branchName,
            },
        })
    } catch (error) {
        console.error('Verify token error:', error)
        return NextResponse.json(
            { error: 'An error occurred during verification' },
            { status: 500 }
        )
    }
}
