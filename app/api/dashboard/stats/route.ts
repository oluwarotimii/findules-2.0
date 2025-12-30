import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        const payload = verifyToken(token) as any

        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const isManager = payload.role === 'MANAGER'
        const branchId = payload.branchId
        const whereClause = isManager ? {} : { branchId }

        // Date ranges
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay() + 1)

        // Cash Requisitions
        const requisitions = await prisma.cashRequisition.findMany({
            where: { ...whereClause, dateRecorded: { gte: monthStart } },
        })

        // Reconciliations
        const reconciliations = await prisma.reconciliation.findMany({
            where: { ...whereClause, date: { gte: today, lt: tomorrow } },
        })

        // Fuel Coupons
        const fuelCoupons = await prisma.fuelCoupon.findMany({
            where: { ...whereClause, date: { gte: weekStart } },
        })

        // Imprest
        const imprest = await prisma.imprest.findMany({
            where: { ...whereClause, status: { in: ['ISSUED', 'OVERDUE'] } },
        })

        return NextResponse.json({
            requisitions: {
                total: requisitions.length,
                amount: requisitions.reduce((sum: number, r: any) => sum + Number(r.amount), 0),
                pending: requisitions.filter((r: any) => r.status === 'RECORDED').length,
                paid: requisitions.filter((r: any) => r.status === 'PAID').length,
            },
            reconciliations: {
                today: reconciliations.length,
                missing: 0,
                variances: reconciliations.filter((r: any) => r.varianceCategory && r.varianceCategory !== 'NO_VARIANCE').length,
            },
            fuelCoupons: {
                thisWeek: fuelCoupons.length,
                totalAmount: fuelCoupons.reduce((sum: number, f: any) => sum + Number(f.estimatedAmount), 0),
            },
            imprest: {
                outstanding: imprest.filter((i: any) => i.status === 'ISSUED').length,
                outstandingAmount: imprest.filter((i: any) => i.status === 'ISSUED').reduce((sum: number, i: any) => sum + Number(i.amount), 0),
                overdue: imprest.filter((i: any) => i.status === 'OVERDUE').length,
            },
            recentActivity: await prisma.auditLog.findMany({
                where: isManager ? {} : { id: payload.id },
                take: 5,
                orderBy: { timestamp: 'desc' },
                include: { user: { select: { name: true } } }
            })
        })
    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
    }
}
