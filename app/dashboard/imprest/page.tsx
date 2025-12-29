'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    Plus,
    Search,
    Filter,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Trash2,
    Download
} from 'lucide-react'

interface Imprest {
    imprestNo: string
    staffName: string
    amount: number
    category: string
    purpose: string
    dateIssued: string
    status: 'ISSUED' | 'RETIRED' | 'OVERDUE'
    dateRetired?: string
    amountSpent?: number
    balance?: number
    issuer: { name: string }
    retirer?: { name: string }
    branch: { branchName: string }
}

interface BranchBalance {
    openingBalance: number
    currentBalance: number
    totalIssued: number
    totalRetired: number
}

export default function ImprestPage() {
    const router = useRouter()
    const [imprest, setImprest] = useState<Imprest[]>([])
    const [filteredImprest, setFilteredImprest] = useState<Imprest[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const [branchBalance, setBranchBalance] = useState<BranchBalance | null>(null)
    const [userRole, setUserRole] = useState<string>('')

    useEffect(() => {
        // Get user role
        const userData = localStorage.getItem('user')
        if (userData) {
            const user = JSON.parse(userData)
            setUserRole(user.role)

            // Fetch branch balance for branch admins
            if (user.role === 'BRANCH_ADMIN') {
                fetchBranchBalance(user.branchId)
            }
        }
        fetchImprest()
    }, [])

    useEffect(() => {
        filterImprest()
    }, [imprest, activeTab, searchTerm])

    const fetchBranchBalance = async (branchId: string) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/branch-balance/${branchId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setBranchBalance({
                    openingBalance: Number(data.openingBalance),
                    currentBalance: Number(data.currentBalance),
                    totalIssued: Number(data.totalIssued),
                    totalRetired: Number(data.totalRetired)
                })
            }
        } catch (error) {
            console.error('Error fetching branch balance:', error)
        }
    }

    const fetchImprest = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/imprest', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setImprest(data)
            }
        } catch (error) {
            console.error('Error fetching imprest:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterImprest = () => {
        let filtered = imprest

        // Filter by status tab
        if (activeTab !== 'ALL') {
            filtered = filtered.filter(i => i.status === activeTab)
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(i =>
                i.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.imprestNo.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredImprest(filtered)
    }

    const handleExport = async (format: 'csv' | 'excel') => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/export/imprest?format=${format}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `imprest_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
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

    const handleDelete = async (imprestNo: string) => {
        if (!confirm('Are you sure you want to delete this imprest?')) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/imprest/${imprestNo}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                fetchImprest()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to delete imprest')
            }
        } catch (error) {
            console.error('Error deleting imprest:', error)
            alert('Failed to delete imprest')
        }
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            ISSUED: 'bg-[color:var(--secondary)/.1] text-[color:var(--secondary)]',
            RETIRED: 'bg-[color:var(--success)/.1] text-[color:var(--success)]',
            OVERDUE: 'bg-[color:var(--destructive)/.1] text-[color:var(--destructive)]'
        }
        return badges[status as keyof typeof badges] || 'bg-[color:var(--muted)/.1] text-[color:var(--muted)]'
    }

    const getStatusIcon = (status: string) => {
        if (status === 'ISSUED') return <Clock className="w-4 h-4" />
        if (status === 'RETIRED') return <CheckCircle className="w-4 h-4" />
        if (status === 'OVERDUE') return <AlertCircle className="w-4 h-4" />
        return null
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount)
    }

    const calculateDaysOutstanding = (dateIssued: string) => {
        const issued = new Date(dateIssued)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - issued.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Calculate summary stats
    const stats = {
        outstanding: imprest.filter(i => i.status === 'ISSUED').length,
        outstandingAmount: imprest.filter(i => i.status === 'ISSUED').reduce((sum, i) => sum + Number(i.amount), 0),
        overdue: imprest.filter(i => i.status === 'OVERDUE').length,
        retired: imprest.filter(i => i.status === 'RETIRED').length
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent)]"></div>
            </div>
        )
    }

    return (
        <div className="text-[color:var(--card-foreground)]">
            {/* Branch Balance Card for Branch Admins */}
            {userRole === 'BRANCH_ADMIN' && branchBalance && (
                <div className="mb-6 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--accent)] p-6 rounded-xl shadow-lg text-white">
                    <h2 className="text-lg font-semibold mb-4">Branch Balance Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-white/70 text-sm">Opening Balance</p>
                            <p className="text-2xl font-bold">₦{branchBalance.openingBalance.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Current Balance</p>
                            <p className="text-2xl font-bold">₦{branchBalance.currentBalance.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Total Issued</p>
                            <p className="text-2xl font-bold">₦{branchBalance.totalIssued.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Total Retired</p>
                            <p className="text-2xl font-bold">₦{branchBalance.totalRetired.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
                        <Wallet className="w-8 h-8 mr-3 text-[color:var(--accent)]" />
                        Imprest Management
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] text-sm mt-1">Track cash advances and retirements</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExport('csv')} className="flex items-center px-4 py-2 border border-[color:var(--border)] text-[color:var(--card-foreground)] rounded-lg hover:bg-[color:var(--muted)/.2]">
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                    </button>
                    <button onClick={() => handleExport('excel')} className="flex items-center px-4 py-2 border border-[color:var(--border)] text-[color:var(--card-foreground)] rounded-lg hover:bg-[color:var(--muted)/.2]">
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/imprest/issue')}
                        className="flex items-center px-6 py-3 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg font-semibold shadow-lg hover:bg-[color:var(--accent)/.9] transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Issue Imprest
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Outstanding</p>
                            <p className="text-3xl font-bold text-[color:var(--primary)] mt-1">{stats.outstanding}</p>
                        </div>
                        <div className="p-3 bg-[color:var(--primary)/.2] rounded-lg">
                            <Clock className="w-6 h-6 text-[color:var(--primary)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Total Amount</p>
                            <p className="text-2xl font-bold text-[color:var(--card-foreground)] mt-1">
                                ₦{stats.outstandingAmount.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-[color:var(--accent)/.2] rounded-lg">
                            <Wallet className="w-6 h-6 text-[color:var(--accent)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Overdue</p>
                            <p className="text-3xl font-bold text-[color:var(--destructive)] mt-1">{stats.overdue}</p>
                        </div>
                        <div className="p-3 bg-[color:var(--destructive)/.2] rounded-lg">
                            <AlertCircle className="w-6 h-6 text-[color:var(--destructive)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Retired</p>
                            <p className="text-3xl font-bold text-[color:var(--success)] mt-1">{stats.retired}</p>
                        </div>
                        <div className="p-3 bg-[color:var(--success)/.2] rounded-lg">
                            <CheckCircle className="w-6 h-6 text-[color:var(--success)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] mb-6">
                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {['ALL', 'ISSUED', 'RETIRED', 'OVERDUE'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab
                                ? 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)]'
                                : 'bg-[color:var(--muted)/.2] text-[color:var(--card-foreground)] hover:bg-[color:var(--muted)/.3]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by staff name or imprest number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                    />
                </div>
            </div>

            {/* Imprest List */}
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] overflow-hidden">
                {filteredImprest.length === 0 ? (
                    <div className="text-center py-12">
                        <Wallet className="w-16 h-16 text-[color:var(--muted-foreground)] mx-auto mb-4" />
                        <p className="text-[color:var(--muted-foreground)]">No imprest records found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[color:var(--muted)/.1] border-b border-[color:var(--border)]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Imprest No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Staff Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Date Issued
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Days
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[color:var(--border)]">
                                {filteredImprest.map((item) => (
                                    <tr key={item.imprestNo} className="hover:bg-[color:var(--muted)/.1]">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-[color:var(--card-foreground)]">{item.imprestNo}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[color:var(--card-foreground)]">{item.staffName}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-semibold text-[color:var(--card-foreground)]">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[color:var(--muted-foreground)]">{item.category}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[color:var(--muted-foreground)]">
                                                {new Date(item.dateIssued).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'ISSUED' ? 'bg-[color:var(--primary)/.2] text-[color:var(--primary)]' :
                                                item.status === 'RETIRED' ? 'bg-[color:var(--success)/.2] text-[color:var(--success)]' :
                                                    'bg-[color:var(--destructive)/.2] text-[color:var(--destructive)]'
                                                }`}>
                                                {getStatusIcon(item.status)}
                                                <span className="ml-1">{item.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.status !== 'RETIRED' && (
                                                <span className={`text-sm ${calculateDaysOutstanding(item.dateIssued) > 30 ? 'text-[color:var(--destructive)] font-semibold' : 'text-[color:var(--muted-foreground)]'}`}>
                                                    {calculateDaysOutstanding(item.dateIssued)} days
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                {item.status === 'ISSUED' || item.status === 'OVERDUE' ? (
                                                    <button
                                                        onClick={() => router.push(`/dashboard/imprest/${item.imprestNo}/retire`)}
                                                        className="px-3 py-1 bg-[color:var(--success)] text-[color:var(--success-foreground)] rounded-lg hover:bg-[color:var(--success)/.9] transition-colors"
                                                    >
                                                        Retire
                                                    </button>
                                                ) : null}
                                                {item.status !== 'RETIRED' && (
                                                    <button
                                                        onClick={() => handleDelete(item.imprestNo)}
                                                        className="p-1 text-[color:var(--destructive)] hover:bg-[color:var(--destructive)/.1] rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
