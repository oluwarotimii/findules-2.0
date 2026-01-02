import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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

    // Get query parameters for pagination
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build where clause for branch filtering
    const branchWhere: any = user.role !== 'MANAGER' ? { branchId: user.branchId } : {}

    // Get summary data
    const [
      totalImprest,
      activeStaff,
      branches,
      totalImprestCount,
      imprestByCategory,
      imprestByStatus,
      imprestByMonth,
      branchPerformance,
      fuelByType,
      fuelByMonth,
      reconciliationByStatus,
      reconciliationByMonth
    ] = await Promise.all([
      // Total imprest issued
      prisma.imprest.aggregate({
        _sum: { amount: true },
        where: branchWhere
      }),

      // Active staff count
      prisma.user.count({
        where: {
          ...branchWhere,
          status: 'ACTIVE'
        }
      }),

      // Total branches
      prisma.branch.count(),

      // Total imprest count for pagination
      prisma.imprest.count({ where: branchWhere }),

      // Imprest distribution by category
      prisma.imprest.groupBy({
        by: ['category'],
        _sum: {
          amount: true
        },
        where: branchWhere
      }),

      // Imprest status distribution
      prisma.imprest.groupBy({
        by: ['status'],
        _count: {
          status: true
        },
        where: branchWhere
      }),

      // Imprest monthly trends (last 6 months)
      prisma.imprest.groupBy({
        by: ['dateIssued'],
        _sum: {
          amount: true
        },
        where: {
          ...branchWhere,
          dateIssued: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 5))
          }
        },
        orderBy: {
          dateIssued: 'asc'
        }
      }),

      // Branch performance
      prisma.branch.findMany({
        where: user.role !== 'MANAGER' ? { branchId: user.branchId } : {},
        include: {
          _count: {
            select: {
              imprest: {
                where: { status: 'RETIRED' }
              }
            }
          }
        }
      }),

      // Fuel coupon distribution by type
      prisma.fuelCoupon.groupBy({
        by: ['fuelType'],
        _sum: {
          estimatedAmount: true
        },
        where: branchWhere
      }),

      // Fuel coupon monthly trends (last 6 months)
      prisma.fuelCoupon.groupBy({
        by: ['date'],
        _sum: {
          estimatedAmount: true
        },
        where: {
          ...branchWhere,
          date: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 5))
          }
        },
        orderBy: {
          date: 'asc'
        }
      }),

      // Reconciliation status distribution
      prisma.reconciliation.groupBy({
        by: ['approvalStatus'],
        _count: {
          approvalStatus: true
        },
        where: branchWhere
      }),

      // Reconciliation monthly trends (last 6 months)
      prisma.reconciliation.groupBy({
        by: ['date'],
        _count: {
          serialNumber: true
        },
        where: {
          ...branchWhere,
          date: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 5))
          }
        },
        orderBy: {
          date: 'asc'
        }
      })
    ])

    // Calculate retirement rate
    const retiredCount = imprestByStatus.find(s => s.status === 'RETIRED')?.['_count']?.status || 0
    const totalIssued = imprestByStatus.reduce((sum, item) => sum + (item._count.status || 0), 0)
    const retirementRate = totalIssued > 0 ? (retiredCount / totalIssued) * 100 : 0

    // Format imprest distribution by category
    const imprestDistribution = imprestByCategory.map(item => ({
      name: item.category,
      value: Number(item._sum?.amount || 0)
    }))

    // Calculate monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });

      // Filter records for this month
      const monthRecords = imprestByMonth.filter(record => {
        const recordDate = new Date(record.dateIssued);
        return (
          recordDate.getMonth() === date.getMonth() &&
          recordDate.getFullYear() === date.getFullYear()
        );
      });

      const monthTotal = monthRecords.reduce((sum, record) => sum + Number(record._sum?.amount || 0), 0);

      monthlyTrends.push({
        name: monthName,
        value: monthTotal
      });
    }

    // Format branch performance
    const branchPerformanceFormatted = branchPerformance.map(branch => ({
      name: branch.branchName,
      value: branch._count.imprest
    }));

    // Format imprest status distribution
    const imprestStatus = imprestByStatus.map(item => ({
      name: item.status,
      value: item._count.status
    }))

    // Format fuel coupon distribution by type
    const fuelDistribution = fuelByType.map(item => ({
      name: item.fuelType,
      value: Number(item._sum?.estimatedAmount || 0)
    }));

    // Calculate fuel coupon monthly trends
    const fuelMonthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });

      // Filter records for this month
      const monthCoupons = fuelByMonth.filter(record => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === date.getMonth() &&
          recordDate.getFullYear() === date.getFullYear()
        );
      });

      const monthTotal = monthCoupons.reduce((sum, record) => sum + Number(record._sum?.estimatedAmount || 0), 0);

      fuelMonthlyTrends.push({
        name: monthName,
        value: monthTotal
      });
    }

    // Format reconciliation status distribution
    const reconciliationStatus = reconciliationByStatus.map(item => ({
      name: item.approvalStatus,
      value: item._count.approvalStatus
    }));

    // Calculate reconciliation monthly trends
    const reconciliationMonthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });

      // Filter records for this month
      const monthRecs = reconciliationByMonth.filter(record => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === date.getMonth() &&
          recordDate.getFullYear() === date.getFullYear()
        );
      });

      const monthTotal = monthRecs.reduce((sum, record) => sum + record._count.serialNumber, 0);

      reconciliationMonthlyTrends.push({
        name: monthName,
        value: monthTotal
      });
    }

    return NextResponse.json({
      summary: {
        totalImprestIssued: Number(totalImprest._sum.amount || 0),
        activeStaff,
        branches,
        retirementRate: parseFloat(retirementRate.toFixed(2))
      },
      charts: {
        imprestDistribution,
        monthlyTrends,
        branchPerformance: branchPerformanceFormatted,
        imprestStatus,
        fuelDistribution,
        fuelMonthlyTrends,
        reconciliationStatus,
        reconciliationMonthlyTrends
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalImprestCount / limit),
        totalRecords: totalImprestCount,
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}