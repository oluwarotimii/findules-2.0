import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET: List all users
export async function GET(request: NextRequest) {
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
            return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                status: true,
                createdAt: true,
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(users)

    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create new user
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Only managers can create users
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Forbidden - Manager access required' }, { status: 403 })
        }

        const body = await request.json()

        // Validation
        if (!body.name || !body.email || !body.password || !body.role || !body.branchId) {
            return NextResponse.json(
                { error: 'Missing required fields: name, email, password, role, branchId' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Validate password length
        if (body.password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Validate role
        const validRoles = ['STAFF', 'BRANCH_ADMIN', 'MANAGER']
        if (!validRoles.includes(body.role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be STAFF, BRANCH_ADMIN, or MANAGER' },
                { status: 400 }
            )
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: body.email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            )
        }

        // Check if branch exists
        const branch = await prisma.branch.findUnique({
            where: { branchId: body.branchId }
        })

        if (!branch) {
            return NextResponse.json(
                { error: 'Branch not found' },
                { status: 404 }
            )
        }

        // Hash password
        const passwordHash = await bcrypt.hash(body.password, 10)

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                passwordHash,
                role: body.role,
                branchId: body.branchId,
                status: 'ACTIVE'
            }
        })

        // Fetch the created user with branch information
        const userWithBranch = await prisma.user.findUnique({
            where: { id: newUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                branchId: true,
                status: true,
                createdAt: true,
                branch: {
                    select: {
                        branchName: true,
                        branchCode: true
                    }
                }
            }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'CREATE_USER',
                module: 'USER_MANAGEMENT',
                details: {
                    newUserId: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    branchId: newUser.branchId
                },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(userWithBranch)

    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
