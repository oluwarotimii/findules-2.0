import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: List branches
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized. Managers only.' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        const branches = await prisma.branch.findMany({
            select: {
                branchId: true,
                branchName: true,
                branchCode: true,
                location: true,
                status: true,
                createdAt: true
            },
            orderBy: { branchName: 'asc' },
            skip,
            take: limit
        })

        // Get total count for pagination metadata
        const total = await prisma.branch.count()
        const totalPages = Math.ceil(total / limit)

        // Set cache headers for the response
        const response = NextResponse.json({
            data: branches,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        })

        // Add HTTP caching headers
        response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=120') // Cache for 10 minutes
        response.headers.set('Vary', 'Authorization')

        return response

    } catch (error) {
        console.error('Error fetching branches:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST: Create branch
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1]
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await verifyToken(token)
        if (!user || user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized. Managers only.' }, { status: 403 })
        }

        const body = await request.json()
        const { branchName, branchCode } = body

        if (!branchName || !branchCode) {
            return NextResponse.json({ error: 'Branch name and code are required' }, { status: 400 })
        }

        // Check if branchCode already exists
        const existingBranch = await prisma.branch.findFirst({
            where: { branchCode }
        })

        if (existingBranch) {
            return NextResponse.json({ error: 'Branch code already exists' }, { status: 400 })
        }

        // Generate a unique branch ID
        const branchId = `BR-${Date.now().toString().slice(-5)}`

        const branch = await prisma.branch.create({
            data: {
                branchId,
                branchName,
                branchCode
            },
            select: {
                branchId: true,
                branchName: true,
                branchCode: true,
                location: true,
                status: true,
                createdAt: true
            }
        })

        // Log action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'CREATE_BRANCH',
                    module: 'BRANCH_MANAGEMENT',
                    details: { branchId: branch.branchId, branchName: branch.branchName },
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
                }
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the branch creation if audit log creation fails
        }

        return NextResponse.json(branch)

    } catch (error) {
        console.error('Error creating branch:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}