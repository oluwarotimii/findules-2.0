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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)]"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-[color:var(--primary)] rounded-2xl p-8 text-[color:var(--primary-foreground)]">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back, {user?.name}!
                </h1>
                <p className="text-[color:var(--primary-foreground)/.8]">
                    {isManager ? 'Here\'s your financial operations overview' : 'Here\'s your activity summary'}
                </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cash Requisitions */}
                <div className="bg-[color:var(--card)] rounded-xl shadow-sm p-6 border border-[color:var(--border)] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--success)/.2] rounded-lg text-[color:var(--success)]">
                            <Banknote className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">This Month</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[color:var(--card-foreground)] mb-1">
                        {stats?.requisitions.total || 0}
                    </h3>
                    <p className="text-[color:var(--muted-foreground)] text-sm mb-2">Cash Requisitions</p>
                    <p className="text-lg font-semibold text-[color:var(--success)]">
                        ₦{(stats?.requisitions.amount || 0).toLocaleString()}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[color:var(--border)] flex justify-between text-xs">
                        <span className="text-[color:var(--muted-foreground)]">Paid: {stats?.requisitions.paid || 0}</span>
                        <span className="text-[color:var(--warning)]">Pending: {stats?.requisitions.pending || 0}</span>
                    </div>
                </div>

                {/* Reconciliations */}
                <div className="bg-[color:var(--card)] rounded-xl shadow-sm p-6 border border-[color:var(--border)] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--secondary)/.2] rounded-lg text-[color:var(--secondary)]">
                            <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Today</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[color:var(--card-foreground)] mb-1">
                        {stats?.reconciliations.today || 0}
                    </h3>
                    <p className="text-[color:var(--muted-foreground)] text-sm mb-2">Reconciliations</p>
                    <p className="text-lg font-semibold text-[color:var(--secondary)]">
                        {stats?.reconciliations.variances || 0} Variances
                    </p>
                    <div className="mt-3 pt-3 border-t border-[color:var(--border)]">
                        <span className="text-xs text-[color:var(--destructive)]">
                            {stats?.reconciliations.missing || 0} Missing
                        </span>
                    </div>
                </div>

                {/* Fuel Coupons */}
                <div className="bg-[color:var(--card)] rounded-xl shadow-sm p-6 border border-[color:var(--border)] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--warning)/.2] rounded-lg text-[color:var(--warning)]">
                            <Fuel className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">This Week</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[color:var(--card-foreground)] mb-1">
                        {stats?.fuelCoupons.thisWeek || 0}
                    </h3>
                    <p className="text-[color:var(--muted-foreground)] text-sm mb-2">Fuel Coupons</p>
                    <p className="text-lg font-semibold text-[color:var(--warning)]">
                        ₦{(stats?.fuelCoupons.totalAmount || 0).toLocaleString()}
                    </p>
                </div>

                {/* Imprest */}
                <div className="bg-[color:var(--card)] rounded-xl shadow-sm p-6 border border-[color:var(--border)] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--accent)/.2] rounded-lg text-[color:var(--accent)]">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Outstanding</span>
                    </div>
                    <h3 className="text-2xl font-bold text-[color:var(--card-foreground)] mb-1">
                        {stats?.imprest.outstanding || 0}
                    </h3>
                    <p className="text-[color:var(--muted-foreground)] text-sm mb-2">Imprest Funds</p>
                    <p className="text-lg font-semibold text-[color:var(--accent)]">
                        ₦{(stats?.imprest.outstandingAmount || 0).toLocaleString()}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[color:var(--border)]">
                        <span className="text-xs text-[color:var(--destructive)]">
                            {stats?.imprest.overdue || 0} Overdue
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm p-6 border border-[color:var(--border)]">
                <h2 className="text-xl font-bold text-[color:var(--card-foreground)] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/dashboard/requisitions"
                        className="flex flex-col items-center p-4 bg-[color:var(--success)/.1] hover:bg-[color:var(--success)/.2] rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-[color:var(--success)] group-hover:scale-110 transition-transform">
                            <Banknote className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--card-foreground)]">New Requisition</span>
                    </Link>

                    <Link
                        href="/dashboard/reconciliations/create"
                        className="flex flex-col items-center p-4 bg-[color:var(--secondary)/.1] hover:bg-[color:var(--secondary)/.2] rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-[color:var(--secondary)] group-hover:scale-110 transition-transform">
                            <ClipboardCheck className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--card-foreground)]">New Reconciliation</span>
                    </Link>

                    <Link
                        href="/dashboard/fuel"
                        className="flex flex-col items-center p-4 bg-[color:var(--warning)/.1] hover:bg-[color:var(--warning)/.2] rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-[color:var(--warning)] group-hover:scale-110 transition-transform">
                            <Fuel className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--card-foreground)]">New Fuel Coupon</span>
                    </Link>

                    <Link
                        href="/dashboard/imprest"
                        className="flex flex-col items-center p-4 bg-[color:var(--accent)/.1] hover:bg-[color:var(--accent)/.2] rounded-lg transition-colors group"
                    >
                        <div className="mb-2 text-[color:var(--accent)] group-hover:scale-110 transition-transform">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <span className="text-sm font-medium text-[color:var(--card-foreground)]">Issue Imprest</span>
                    </Link>
                </div>
            </div>

            {/* Recent Activity (Manager Only) */}
            {isManager && (
                <div className="bg-[color:var(--card)] rounded-xl shadow-sm p-6 border border-[color:var(--border)]">
                    <h2 className="text-xl font-bold text-[color:var(--card-foreground)] mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {stats?.recentActivity?.length === 0 ? (
                            <p className="text-[color:var(--muted-foreground)] text-sm">No recent activity found.</p>
                        ) : (
                            stats?.recentActivity?.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-4 p-3 bg-[color:var(--muted)/.1] rounded-lg">
                                    <div className={`p-2 rounded ${activity.module === 'RECONCILIATION' ? 'bg-[color:var(--secondary)/.2] text-[color:var(--secondary)]' :
                                        activity.module === 'CASH_REQUISITION' ? 'bg-[color:var(--success)/.2] text-[color:var(--success)]' :
                                            activity.module === 'FUEL_COUPON' ? 'bg-[color:var(--warning)/.2] text-[color:var(--warning)]' :
                                                'bg-[color:var(--muted)/.2] text-[color:var(--muted-foreground)]'
                                        }`}>
                                        {activity.module === 'RECONCILIATION' ? <ClipboardCheck className="w-5 h-5" /> :
                                            activity.module === 'CASH_REQUISITION' ? <Banknote className="w-5 h-5" /> :
                                                activity.module === 'FUEL_COUPON' ? <Fuel className="w-5 h-5" /> :
                                                    <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[color:var(--card-foreground)]">
                                            {activity.action.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-sm text-[color:var(--muted-foreground)]">
                                            by {activity.user.name}
                                        </p>
                                    </div>
                                    <span className="text-xs text-[color:var(--muted-foreground)]">
                                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        href="/reports"
                        className="mt-4 flex items-center justify-center text-[color:var(--primary)] hover:text-[color:var(--primary)/.8] font-medium text-sm"
                    >
                        View All Activity <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            )}

            {/* Alerts (Manager Only) */}
            {isManager && (
                <div className="bg-[color:var(--card)] rounded-xl shadow-sm p-6 border border-[color:var(--border)]">
                    <h2 className="text-xl font-bold text-[color:var(--card-foreground)] mb-4 flex items-center">
                        <AlertTriangle className="w-6 h-6 text-[color:var(--warning)] mr-2" />
                        Alerts & Compliance
                    </h2>
                    <div className="space-y-3">
                        {stats?.reconciliations.missing ? (
                            <div className="p-4 bg-[color:var(--destructive)/.1] border border-[color:var(--destructive)] rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 text-[color:var(--destructive)] mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium text-[color:var(--destructive)]">Missing Reconciliations</p>
                                    <p className="text-sm text-[color:var(--destructive)] mt-1">
                                        {stats.reconciliations.missing} cashier(s) haven't submitted today's reconciliation
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {stats?.imprest.overdue ? (
                            <div className="p-4 bg-[color:var(--warning)/.1] border border-[color:var(--warning)] rounded-lg flex items-start">
                                <Clock className="w-5 h-5 text-[color:var(--warning)] mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium text-[color:var(--warning)]">Overdue Imprest</p>
                                    <p className="text-sm text-[color:var(--warning)] mt-1">
                                        {stats.imprest.overdue} imprest fund(s) overdue for retirement (&gt;30 days)
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {!stats?.reconciliations.missing && !stats?.imprest.overdue && (
                            <div className="p-4 bg-[color:var(--success)/.1] border border-[color:var(--success)] rounded-lg flex items-start">
                                <CheckCircle className="w-5 h-5 text-[color:var(--success)] mr-3 mt-0.5" />
                                <div>
                                    <p className="font-medium text-[color:var(--success)]">All Clear</p>
                                    <p className="text-sm text-[color:var(--success)] mt-1">
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
