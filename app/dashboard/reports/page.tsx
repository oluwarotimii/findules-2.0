'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, FileText, Fuel, Wallet } from 'lucide-react'

export default function ReportsPage() {
    const [stats, setStats] = useState({
        totalRequisitions: 0,
        totalReconciliations: 0,
        totalImprest: 0,
        totalFuelCoupons: 0,
        totalVariance: 0,
        outstandingImprest: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token')

            // Fetch all data
            const [recons, imprest, coupons] = await Promise.all([
                fetch('/api/reconciliations', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
                fetch('/api/imprest', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
                fetch('/api/fuel-coupons', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
            ])

            setStats({
                totalReconciliations: recons.length,
                totalImprest: imprest.length,
                totalFuelCoupons: coupons.length,
                totalRequisitions: 0,
                totalVariance: recons.reduce((sum: number, r: any) => sum + Number(r.overageShortage || 0), 0),
                outstandingImprest: imprest.filter((i: any) => i.status === 'ISSUED').reduce((sum: number, i: any) => sum + Number(i.amount), 0)
            })
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
                    <BarChart3 className="w-8 h-8 mr-3 text-[color:var(--primary)]" />
                    Reports & Analytics
                </h1>
                <p className="text-[color:var(--muted-foreground)] text-sm mt-1">Overview of financial operations</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--primary)/.1] rounded-lg">
                            <FileText className="w-6 h-6 text-[color:var(--primary)]" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-[color:var(--success)]" />
                    </div>
                    <p className="text-[color:var(--muted-foreground)] text-sm">Total Reconciliations</p>
                    <p className="text-3xl font-bold text-[color:var(--card-foreground)] mt-1">{stats.totalReconciliations}</p>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--accent)/.1] rounded-lg">
                            <Wallet className="w-6 h-6 text-[color:var(--accent)]" />
                        </div>
                    </div>
                    <p className="text-[color:var(--muted-foreground)] text-sm">Total Imprest</p>
                    <p className="text-3xl font-bold text-[color:var(--card-foreground)] mt-1">{stats.totalImprest}</p>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--warning)/.1] rounded-lg">
                            <Fuel className="w-6 h-6 text-[color:var(--warning)]" />
                        </div>
                    </div>
                    <p className="text-[color:var(--muted-foreground)] text-sm">Total Fuel Coupons</p>
                    <p className="text-3xl font-bold text-[color:var(--card-foreground)] mt-1">{stats.totalFuelCoupons}</p>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--destructive)/.1] rounded-lg">
                            <DollarSign className="w-6 h-6 text-[color:var(--destructive)]" />
                        </div>
                    </div>
                    <p className="text-[color:var(--muted-foreground)] text-sm">Total Variance</p>
                    <p className={`text-2xl font-bold mt-1 ${stats.totalVariance >= 0 ? 'text-[color:var(--success)]' : 'text-[color:var(--destructive)]'}`}>
                        ₦{stats.totalVariance.toLocaleString()}
                    </p>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[color:var(--accent)/.1] rounded-lg">
                            <Wallet className="w-6 h-6 text-[color:var(--accent)]" />
                        </div>
                    </div>
                    <p className="text-[color:var(--muted-foreground)] text-sm">Outstanding Imprest</p>
                    <p className="text-2xl font-bold text-[color:var(--accent)] mt-1">₦{stats.outstandingImprest.toLocaleString()}</p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                <h2 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a href="/dashboard/reconciliations" className="p-4 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)/.1] transition">
                        <FileText className="w-6 h-6 text-[color:var(--primary)] mb-2" />
                        <p className="font-medium text-[color:var(--card-foreground)]">View Reconciliations</p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">Export & analyze</p>
                    </a>
                    <a href="/dashboard/imprest" className="p-4 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)/.1] transition">
                        <Wallet className="w-6 h-6 text-[color:var(--accent)] mb-2" />
                        <p className="font-medium text-[color:var(--card-foreground)]">View Imprest</p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">Track advances</p>
                    </a>
                    <a href="/dashboard/fuel-coupons" className="p-4 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)/.1] transition">
                        <Fuel className="w-6 h-6 text-[color:var(--warning)] mb-2" />
                        <p className="font-medium text-[color:var(--card-foreground)]">View Fuel Coupons</p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">Manage coupons</p>
                    </a>
                    <a href="/dashboard/cashiers" className="p-4 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)/.1] transition">
                        <DollarSign className="w-6 h-6 text-[color:var(--secondary)] mb-2" />
                        <p className="font-medium text-[color:var(--card-foreground)]">View Cashiers</p>
                        <p className="text-sm text-[color:var(--muted-foreground)]">Manage cashiers</p>
                    </a>
                </div>
            </div>
        </div>
    )
}
