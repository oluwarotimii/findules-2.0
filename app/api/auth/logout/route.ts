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
        try {
            await prisma.auditLog.create({
                data: {
                    userId: payload.id,
                    action: 'logout',
                    module: 'auth',
                    details: {
                        timestamp: new Date().toISOString(),
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                },
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the logout if audit log creation fails
        }

        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        })

        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: -1,
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'An error occurred during logout' },
            { status: 500 }
        )
    }
}
