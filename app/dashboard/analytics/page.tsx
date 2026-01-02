'use client'

import { useState, useEffect } from 'react'
import {
  Wallet,
  Users,
  Building,
  TrendingUp,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'


export default function AnalyticsPage() {
  const [selectedBranch, setSelectedBranch] = useState('ALL')
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<any>(null)

  useEffect(() => {
    // Get user data to determine role and branch
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)

      // Fetch branches and analytics data based on user role
      fetchBranches(user)
      fetchAnalyticsData(user, currentPage, limit)
    }
  }, [selectedBranch, currentPage, limit])

  const fetchAnalyticsData = async (user: any, page: number, limit: number) => {
    try {
      const token = localStorage.getItem('token')
      let url = `/api/analytics?page=${page}&limit=${limit}`

      // Add branch filter if not manager
      if (user.role !== 'MANAGER' && selectedBranch !== 'ALL') {
        url += `&branchId=${selectedBranch}`
      } else if (selectedBranch !== 'ALL') {
        url += `&branchId=${selectedBranch}`
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (res.ok) {
        const data = await res.json()
        setAnalyticsData(data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    }
  }

  const fetchBranches = async (user: any) => {
    try {
      const token = localStorage.getItem('token')
      let url = '/api/branches'

      // For branch admins and staff, only show their branch
      if (user.role !== 'MANAGER') {
        url = `/api/branches?id=${user.branchId}`
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setBranches(data)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use real data if available, otherwise use mock data
  const imprestDistribution = analyticsData ? analyticsData.charts.imprestDistribution : [
    { name: 'Transport', value: 45000 },
    { name: 'Meals', value: 25000 },
    { name: 'Supplies', value: 20000 },
    { name: 'Other', value: 10000 },
  ]

  const monthlyTrends = analyticsData ? analyticsData.charts.monthlyTrends : [
    { name: 'Jan', value: 12000 },
    { name: 'Feb', value: 19000 },
    { name: 'Mar', value: 15000 },
    { name: 'Apr', value: 18000 },
    { name: 'May', value: 21000 },
    { name: 'Jun', value: 25000 },
  ]

  const branchPerformance = analyticsData ? analyticsData.charts.branchPerformance : [
    { name: 'Head Office', value: 85 },
    { name: 'Lagos', value: 78 },
    { name: 'Abuja', value: 92 },
    { name: 'Port Harcourt', value: 65 },
  ]

  // Additional analytics data
  const fuelDistribution = analyticsData ? analyticsData.charts.fuelDistribution : [
    { name: 'Petrol', value: 15000 },
    { name: 'Diesel', value: 12000 },
  ]

  const fuelMonthlyTrends = analyticsData ? analyticsData.charts.fuelMonthlyTrends : [
    { name: 'Jan', value: 2000 },
    { name: 'Feb', value: 2500 },
    { name: 'Mar', value: 1800 },
    { name: 'Apr', value: 2200 },
    { name: 'May', value: 2100 },
    { name: 'Jun', value: 2400 },
  ]

  const reconciliationStatus = analyticsData ? analyticsData.charts.reconciliationStatus : [
    { name: 'Pending', value: 5 },
    { name: 'Approved', value: 12 },
    { name: 'Rejected', value: 2 },
  ]

  const reconciliationMonthlyTrends = analyticsData ? analyticsData.charts.reconciliationMonthlyTrends : [
    { name: 'Jan', value: 8 },
    { name: 'Feb', value: 12 },
    { name: 'Mar', value: 10 },
    { name: 'Apr', value: 15 },
    { name: 'May', value: 11 },
    { name: 'Jun', value: 14 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[color:var(--card-foreground)]">Analytics Dashboard</h1>
          <p className="text-[color:var(--muted-foreground)]">Visualize financial operations and trends</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div>
            <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">Filter by Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value)
                setCurrentPage(1) // Reset to first page when changing branch
              }}
              className="w-full sm:w-48 bg-[color:var(--card)] border border-[color:var(--border)] text-[color:var(--card-foreground)] p-2 rounded"
            >
              <option value="ALL">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[color:var(--muted-foreground)] mb-1">Records per page</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setCurrentPage(1) // Reset to first page when changing limit
              }}
              className="w-full sm:w-24 bg-[color:var(--card)] border border-[color:var(--border)] text-[color:var(--card-foreground)] p-2 rounded"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6 relative group">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[color:var(--muted-foreground)]">Total Imprest Issued</h3>
              <div className="relative">
                <Info className="w-4 h-4 text-[color:var(--muted-foreground)] cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[color:var(--popover)] border border-[color:var(--border)] rounded-md shadow-lg z-10">
                  <p className="text-xs text-[color:var(--popover-foreground)]">Total amount of imprest issued across all branches</p>
                </div>
              </div>
            </div>
            <Wallet className="w-5 h-5 text-[color:var(--primary)]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[color:var(--card-foreground)]">
              {analyticsData ? `₦${Number(analyticsData.summary.totalImprestIssued).toLocaleString()}` : '₦0'}
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">+12% from last month</p>
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6 relative group">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[color:var(--muted-foreground)]">Active Staff</h3>
              <div className="relative">
                <Info className="w-4 h-4 text-[color:var(--muted-foreground)] cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[color:var(--popover)] border border-[color:var(--border)] rounded-md shadow-lg z-10">
                  <p className="text-xs text-[color:var(--popover-foreground)]">Number of active staff members across branches</p>
                </div>
              </div>
            </div>
            <Users className="w-5 h-5 text-[color:var(--success)]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[color:var(--card-foreground)]">
              {analyticsData ? analyticsData.summary.activeStaff : '0'}
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">Across all branches</p>
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6 relative group">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[color:var(--muted-foreground)]">Branches</h3>
              <div className="relative">
                <Info className="w-4 h-4 text-[color:var(--muted-foreground)] cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[color:var(--popover)] border border-[color:var(--border)] rounded-md shadow-lg z-10">
                  <p className="text-xs text-[color:var(--popover-foreground)]">Total number of active branches</p>
                </div>
              </div>
            </div>
            <Building className="w-5 h-5 text-[color:var(--accent)]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[color:var(--card-foreground)]">
              {analyticsData ? analyticsData.summary.branches : '0'}
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">Active locations</p>
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6 relative group">
          <div className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[color:var(--muted-foreground)]">Retirement Rate</h3>
              <div className="relative">
                <Info className="w-4 h-4 text-[color:var(--muted-foreground)] cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-[color:var(--popover)] border border-[color:var(--border)] rounded-md shadow-lg z-10">
                  <p className="text-xs text-[color:var(--popover-foreground)]">Percentage of imprest records that have been retired on time</p>
                </div>
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-[color:var(--warning)]" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[color:var(--card-foreground)]">
              {analyticsData ? `${analyticsData.summary.retirementRate}%` : '0%'}
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">On time</p>
          </div>
        </div>
      </div>

      {/* Text-based Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Imprest Distribution by Category</h3>
          <div className="space-y-2">
            {imprestDistribution.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">₦{Number(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Branch Performance</h3>
          <div className="space-y-2">
            {branchPerformance.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Monthly Imprest Trends</h3>
          <div className="space-y-2">
            {monthlyTrends.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">₦{Number(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Imprest Status Overview</h3>
          <div className="space-y-2">
            {(analyticsData ? analyticsData.charts.imprestStatus : [
              { name: 'Issued', value: 65 },
              { name: 'Retired', value: 35 },
            ]).map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Fuel Coupons Distribution by Type</h3>
          <div className="space-y-2">
            {fuelDistribution.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">₦{Number(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Reconciliation Status Overview</h3>
          <div className="space-y-2">
            {reconciliationStatus.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Monthly Fuel Coupon Trends</h3>
          <div className="space-y-2">
            {fuelMonthlyTrends.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">₦{Number(item.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Monthly Reconciliation Trends</h3>
          <div className="space-y-2">
            {reconciliationMonthlyTrends.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[color:var(--border)/.3]">
                <span className="text-[color:var(--muted-foreground)]">{item.name}</span>
                <span className="font-medium text-[color:var(--card-foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4">
          <div className="text-sm text-[color:var(--muted-foreground)] mb-2 sm:mb-0">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} records
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={pagination.currentPage === 1}
              className={`p-2 rounded-lg ${pagination.currentPage === 1 ? 'bg-[color:var(--border)] text-[color:var(--muted-foreground)] cursor-not-allowed' : 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent)]'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-2 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg text-[color:var(--card-foreground)]">
              {pagination.currentPage} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={pagination.currentPage === pagination.totalPages}
              className={`p-2 rounded-lg ${pagination.currentPage === pagination.totalPages ? 'bg-[color:var(--border)] text-[color:var(--muted-foreground)] cursor-not-allowed' : 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent)]'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}