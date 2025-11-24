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
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
                    Reports & Analytics
                </h1>
                <p className="text-gray-500 text-sm mt-1">Overview of financial operations</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-gray-500 text-sm">Total Reconciliations</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalReconciliations}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Wallet className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Total Imprest</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalImprest}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Fuel className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Total Fuel Coupons</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalFuelCoupons}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Total Variance</p>
                    <p className={`text-2xl font-bold mt-1 ${stats.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₦{stats.totalVariance.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Wallet className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Outstanding Imprest</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">₦{stats.outstandingImprest.toLocaleString()}</p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a href="/dashboard/reconciliations" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                        <FileText className="w-6 h-6 text-blue-600 mb-2" />
                        <p className="font-medium text-gray-800">View Reconciliations</p>
                        <p className="text-sm text-gray-500">Export & analyze</p>
                    </a>
                    <a href="/dashboard/imprest" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                        <Wallet className="w-6 h-6 text-orange-600 mb-2" />
                        <p className="font-medium text-gray-800">View Imprest</p>
                        <p className="text-sm text-gray-500">Track advances</p>
                    </a>
                    <a href="/dashboard/fuel-coupons" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                        <Fuel className="w-6 h-6 text-green-600 mb-2" />
                        <p className="font-medium text-gray-800">View Fuel Coupons</p>
                        <p className="text-sm text-gray-500">Manage coupons</p>
                    </a>
                    <a href="/dashboard/cashiers" className="p-4 border rounded-lg hover:bg-gray-50 transition">
                        <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
                        <p className="font-medium text-gray-800">View Cashiers</p>
                        <p className="text-sm text-gray-500">Manage cashiers</p>
                    </a>
                </div>
            </div>
        </div>
    )
}
