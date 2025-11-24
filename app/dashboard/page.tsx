'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Banknote,
    ClipboardCheck,
    Fuel,
    Wallet,
    AlertTriangle,
    CheckCircle,
    Clock,
    AlertCircle,
    PlusCircle,
    ArrowRight
} from 'lucide-react'

interface DashboardStats {
    requisitions: {
        total: number
        amount: number
        pending: number
        paid: number
    }
    reconciliations: {
        today: number
        missing: number
        variances: number
    }
    fuelCoupons: {
        thisWeek: number
        totalAmount: number
    }
    imprest: {
        outstanding: number
        outstandingAmount: number
        overdue: number
    }
    recentActivity: Array<{
        id: number
        action: string
        module: string
        timestamp: string
        details: any
        user: { name: string }
    }>
}

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (userData) {
            setUser(JSON.parse(userData))
        }

        // Fetch dashboard stats
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/dashboard/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const isManager = user?.role === 'MANAGER'

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.name}!
                </h1>
                <p className="text-blue-100">
                    {isManager ? 'Here\'s your financial operations overview' : 'Here\'s your activity summary'}
                </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cash Requisitions */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <Banknote className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">This Month</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {stats?.requisitions.total || 0}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">Cash Requisitions</p>
                    <p className="text-lg font-semibold text-green-600">
                        ₦{(stats?.requisitions.amount || 0).toLocaleString()}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
                        <span className="text-gray-500">Paid: {stats?.requisitions.paid || 0}</span>
                        <span className="text-orange-600">Pending: {stats?.requisitions.pending || 0}</span>
                    </div>
                </div>

                {/* Reconciliations */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                            <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Today</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {stats?.reconciliations.today || 0}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">Reconciliations</p>
                    <p className="text-lg font-semibold text-blue-600">
                        {stats?.reconciliations.variances || 0} Variances
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-red-600">
                            {stats?.reconciliations.missing || 0} Missing
                        </span>
                    </div>
                </div>

                {/* Fuel Coupons */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                            <Fuel className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">This Week</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {stats?.fuelCoupons.thisWeek || 0}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">Fuel Coupons</p>
                    <p className="text-lg font-semibold text-purple-600">
                        ₦{(stats?.fuelCoupons.totalAmount || 0).toLocaleString()}
                    </p>
                </div>

                {/* Imprest */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Outstanding</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {stats?.imprest.outstanding || 0}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">Imprest Funds</p>
                    <p className="text-lg font-semibold text-orange-600">
                        ₦{(stats?.imprest.outstandingAmount || 0).toLocaleString()}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-red-600">
                            {stats?.imprest.overdue || 0} Overdue
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/dashboard/requisitions"
                        className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-green-600 group-hover:scale-110 transition-transform">
                            <Banknote className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">New Requisition</span>
                    </Link>

                    <Link
                        href="/dashboard/reconciliations/create"
                        className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-blue-600 group-hover:scale-110 transition-transform">
                            <ClipboardCheck className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">New Reconciliation</span>
                    </Link>

                    <Link
                        href="/dashboard/fuel"
                        className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-purple-600 group-hover:scale-110 transition-transform">
                            <Fuel className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">New Fuel Coupon</span>
                    </Link>

                    <Link
                        href="/dashboard/imprest"
                        className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-orange-600 group-hover:scale-110 transition-transform">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Issue Imprest</span>
                    </Link>
                </div>
            </div>

            {/* Recent Activity (Manager Only) */}
            {isManager && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {stats?.recentActivity?.length === 0 ? (
                            <p className="text-gray-500 text-sm">No recent activity found.</p>
                        ) : (
                            stats?.recentActivity?.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div className={`p-2 rounded ${activity.module === 'RECONCILIATION' ? 'bg-blue-100 text-blue-600' :
                                        activity.module === 'CASH_REQUISITION' ? 'bg-green-100 text-green-600' :
                                            activity.module === 'FUEL_COUPON' ? 'bg-purple-100 text-purple-600' :
                                                'bg-gray-200 text-gray-600'
                                        }`}>
                                        {activity.module === 'RECONCILIATION' ? <ClipboardCheck className="w-5 h-5" /> :
                                            activity.module === 'CASH_REQUISITION' ? <Banknote className="w-5 h-5" /> :
                                                activity.module === 'FUEL_COUPON' ? <Fuel className="w-5 h-5" /> :
                                                    <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">
                                            {activity.action.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            by {activity.user.name}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        href="/reports"
                        className="mt-4 flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                        View All Activity <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            )}

            {/* Alerts (Manager Only) */}
            {isManager && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
                        Alerts & Compliance
                    </h2>
                    <div className="space-y-3">
                        {stats?.reconciliations.missing ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">Missing Reconciliations</p>
                                    <p className="text-sm text-red-600 mt-1">
                                        {stats.reconciliations.missing} cashier(s) haven't submitted today's reconciliation
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {stats?.imprest.overdue ? (
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start">
                                <Clock className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium text-orange-800">Overdue Imprest</p>
                                    <p className="text-sm text-orange-600 mt-1">
                                        {stats.imprest.overdue} imprest fund(s) overdue for retirement (&gt;30 days)
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {!stats?.reconciliations.missing && !stats?.imprest.overdue && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-800">All Clear</p>
                                    <p className="text-sm text-green-600 mt-1">
                                        No compliance issues at this time
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
