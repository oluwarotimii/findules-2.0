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

        const branches = await prisma.branch.findMany({
            orderBy: { branchName: 'asc' }
        })

        return NextResponse.json(branches)

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
            }
        })

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: user.userId,
                action: 'CREATE_BRANCH',
                module: 'BRANCH_MANAGEMENT',
                details: { branchId: branch.branchId, branchName: branch.branchName },
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
            }
        })

        return NextResponse.json(branch)

    } catch (error) {
        console.error('Error creating branch:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}