import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token)

        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Log the logout
        await prisma.auditLog.create({
            data: {
                userId: payload.userId,
                action: 'logout',
                module: 'auth',
                details: {
                    timestamp: new Date().toISOString(),
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'An error occurred during logout' },
            { status: 500 }
        )
    }
}
