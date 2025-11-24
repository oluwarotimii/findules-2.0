import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// GET: List audit logs
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

        // Only managers can access audit logs
        if (user.role !== 'MANAGER') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const module = searchParams.get('module')
        const userId = searchParams.get('userId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build query filters
        const where: any = {}

        // Module filter
        if (module && module !== 'ALL') {
            where.module = module
        }

        // User ID filter
        if (userId) {
            where.userId = userId
        }

        // Date range filter
        if (startDate || endDate) {
            where.timestamp = {}
            if (startDate) {
                where.timestamp.gte = new Date(startDate)
            }
            if (endDate) {
                where.timestamp.lte = new Date(endDate)
            }
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            },
            take: 100 // Limit to last 100 logs for performance
        })

        return NextResponse.json(logs)

    } catch (error) {
        console.error('Error fetching audit logs:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}