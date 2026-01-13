import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { loginLimiter, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        // Rate limiting for login attempts
        const clientIP = getClientIP(request)
        const rateLimitResult = await loginLimiter.check(`login_${clientIP}`)

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: 'Too many login attempts. Please try again later.',
                    retryAfter: rateLimitResult.retryAfter
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': rateLimitResult.retryAfter.toString()
                    }
                }
            )
        }

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
            select: {
                id: true,
                name: true,
                email: true,
                passwordHash: true,
                role: true,
                branchId: true,
                status: true,
                branch: {
                    select: {
                        branchName: true
                    }
                }
            },
        })

        console.log('Login attempt for:', email)
        console.log('User found:', user ? 'Yes' : 'No')

        if (!user) {
            console.log('User not found in database')
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        console.log('User status:', user.status)
        console.log('User role:', user.role)
        console.log('Password hash from DB:', user.passwordHash.substring(0, 20) + '...')

        if (user.status !== 'ACTIVE') {
            console.log('User account is inactive')
            return NextResponse.json(
                { error: 'Account is inactive. Please contact administrator.' },
                { status: 403 }
            )
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash)
        console.log('Password valid:', isValidPassword)

        if (!isValidPassword) {
            console.log('Password verification failed')
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            branchId: user.branchId,
        })

        // Create audit log for successful login
        try {
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
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the login if audit log creation fails
        }

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
