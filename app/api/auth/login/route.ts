import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { branch: true },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        if (user.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Account is inactive. Please contact administrator.' },
                { status: 403 }
            )
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash)

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId,
        })

        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'login',
                module: 'auth',
                details: {
                    email: user.email,
                    timestamp: new Date().toISOString(),
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            },
        })

        const response = NextResponse.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                branchId: user.branchId,
                branchName: user.branch.branchName,
            },
        })

        response.cookies.set('token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 8,
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'An error occurred during login' },
            { status: 500 }
        )
    }
}
