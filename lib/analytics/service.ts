// lib/analytics/service.ts
import { prisma } from '@/lib/prisma'

export interface AnalyticsData {
  summary: {
    totalImprestIssued: number
    activeStaff: number
    branches: number
    retirementRate: number
  }
  charts: {
    imprestDistribution: { name: string; value: number }[]
    monthlyTrends: { name: string; value: number }[]
    branchPerformance: { name: string; value: number }[]
    imprestStatus: { name: string; value: number }[]
  }
}

export class AnalyticsService {
  static async getAnalytics(branchId?: string): Promise<AnalyticsData> {
    // Build where clause for branch filtering
    const branchWhere: any = branchId ? { branchId } : {}

    // Get summary data
    const [
      totalImprest,
      activeStaff,
      branches,
      imprestRecords
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
      
      // All imprest records for calculations
      prisma.imprest.findMany({
        where: branchWhere,
        include: {
          branch: true
        }
      })
    ])

    // Calculate retirement rate
    const retiredCount = imprestRecords.filter(i => i.status === 'RETIRED').length
    const totalIssued = imprestRecords.length
    const retirementRate = totalIssued > 0 ? (retiredCount / totalIssued) * 100 : 0

    // Calculate imprest distribution by category
    const categoryMap = new Map<string, number>()
    imprestRecords.forEach(record => {
      const category = record.category
      const current = categoryMap.get(category) || 0
      categoryMap.set(category, current + Number(record.amount))
    })
    
    const imprestDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }))

    // Calculate monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });

      const monthRecords = imprestRecords.filter(record => {
        const recordDate = new Date(record.dateIssued);
        return (
          recordDate.getMonth() === date.getMonth() &&
          recordDate.getFullYear() === date.getFullYear()
        );
      });

      const monthTotal = monthRecords.reduce((sum, record) => sum + Number(record.amount), 0);

      monthlyTrends.push({
        name: monthName,
        value: monthTotal
      });
    }

    // Calculate branch performance
    const branchWhereClause = branchId ? { branchId } : {};
    const branchesWithCounts = await prisma.branch.findMany({
      where: branchWhereClause,
      include: {
        _count: {
          select: {
            imprest: {
              where: { status: 'RETIRED' }
            }
          }
        }
      }
    });

    const branchPerformance = branchesWithCounts.map(branch => ({
      name: branch.branchName,
      value: branch._count.imprest
    }));

    // Calculate imprest status distribution
    const statusCounts = imprestRecords.reduce((acc, record) => {
      const status = record.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const imprestStatus = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }))

    return {
      summary: {
        totalImprestIssued: Number(totalImprest._sum.amount || 0),
        activeStaff,
        branches,
        retirementRate: parseFloat(retirementRate.toFixed(2))
      },
      charts: {
        imprestDistribution,
        monthlyTrends,
        branchPerformance,
        imprestStatus
      }
    }
  }
}