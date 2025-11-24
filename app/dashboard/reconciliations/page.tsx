'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Download
} from 'lucide-react'

interface Reconciliation {
    serialNumber: string
    date: string
    cashierName: string

    actualTotalSales: number
    actualClosingBalance: number
    overageShortage: number
    varianceCategory: string
    branch: {
        branchName: string
    }
}

export default function ReconciliationsPage() {
    const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchReconciliations()
    }, [])

    const fetchReconciliations = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/reconciliations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setReconciliations(data)
            }
        } catch (error) {
            console.error('Error fetching reconciliations:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getVarianceColor = (variance: number) => {
        if (Math.abs(variance) < 100) return 'text-green-600 bg-green-50'
        if (variance < 0) return 'text-red-600 bg-red-50'
        return 'text-yellow-600 bg-yellow-50'
    }

    const filteredReconciliations = reconciliations.filter(rec =>
        rec.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/export/reconciliations?format=${format}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `reconciliations_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                window.URL.revokeObjectURL(url)
            } else {
                alert('Failed to export data')
            }
        } catch (error) {
            console.error('Error exporting:', error)
            alert('Failed to export data')
        }
    }

    // Calculate Summary Stats
    const totalReconciliations = filteredReconciliations.length
    const totalVariance = filteredReconciliations.reduce((acc, curr) => acc + curr.overageShortage, 0)
    const balancedCount = filteredReconciliations.filter(r => Math.abs(r.overageShortage) < 100).length
    const issueCount = totalReconciliations - balancedCount

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reconciliations</h1>
                    <p className="text-gray-500 text-sm">Manage and view daily cashier reconciliations</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                    </button>
                    <Link
                        href="/dashboard/reconciliations/create"
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Reconciliation
                    </Link>
                </div>
            </div>

            {/* Variance Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Total Records</span>
                        <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{totalReconciliations}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Net Variance</span>
                        <div className={`p-1 rounded ${totalVariance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {totalVariance >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        </div>
                    </div>
                    <p className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalVariance)}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Balanced</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{balancedCount}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">Issues / Review</span>
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{issueCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by cashier or serial number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Filter className="w-5 h-5 mr-2" />
                    Filter
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Serial No</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cashier</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Total Sales</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Closing Bal</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Variance</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                            Loading data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredReconciliations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No reconciliations found.
                                    </td>
                                </tr>
                            ) : (
                                filteredReconciliations.map((rec) => (
                                    <tr key={rec.serialNumber} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-blue-600">{rec.serialNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{formatDate(rec.date)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{rec.cashierName}</div>
                                            <div className="text-xs text-gray-500">{rec.branch.branchName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {formatCurrency(rec.actualTotalSales)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            {formatCurrency(rec.actualClosingBalance)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVarianceColor(rec.overageShortage)}`}>
                                                {rec.overageShortage > 0 ? '+' : ''}{formatCurrency(rec.overageShortage)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {Math.abs(rec.overageShortage) < 100 ? (
                                                <span className="inline-flex items-center text-green-600 text-xs font-medium">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Balanced
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-red-600 text-xs font-medium">
                                                    <AlertCircle className="w-4 h-4 mr-1" />
                                                    Review
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
