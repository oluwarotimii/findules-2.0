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

        // Create user in a transaction with audit log
        const newUser = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    name: body.name,
                    email: body.email,
                    passwordHash,
                    role: body.role,
                    branchId: body.branchId,
                    status: 'ACTIVE'
                },
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
            await tx.auditLog.create({
                data: {
                    userId: user.id, // This should be the ID from the JWT token
                    action: 'CREATE_USER',
                    module: 'USER_MANAGEMENT',
                    details: {
                        newUserId: createdUser.id,
                        name: createdUser.name,
                        email: createdUser.email,
                        role: createdUser.role,
                        branchId: createdUser.branchId
                    },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })

            return createdUser
        })

        return NextResponse.json(newUser)

    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
