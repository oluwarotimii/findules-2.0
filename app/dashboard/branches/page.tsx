'use client'

import { useState, useEffect } from 'react'
import {
    Building,
    Plus,
    Search,
    AlertCircle,
    CheckCircle,
    Wallet,
    ArrowUpCircle,
    TrendingUp,
    DollarSign
} from 'lucide-react'

interface Branch {
    branchId: string
    branchName: string
    branchCode: string
    branchBalance?: {
        id: string
        openingBalance: number
        currentBalance: number
        totalIssued: number
        totalRetired: number
    }
}

export default function BranchManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [showBalanceModal, setShowBalanceModal] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

    // New Branch Form State
    const [branchName, setBranchName] = useState('')
    const [branchCode, setBranchCode] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Balance Form State
    const [balanceAmount, setBalanceAmount] = useState('')
    const [balanceNotes, setBalanceNotes] = useState('')
    const [balanceSubmitting, setBalanceSubmitting] = useState(false)

    useEffect(() => {
        fetchBranches()
    }, [])

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token')

            // Fetch branches
            const branchesRes = await fetch('/api/branches', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!branchesRes.ok) {
                throw new Error('Failed to fetch branches')
            }

            const branchesData = await branchesRes.json()

            // Fetch branch balances
            const balancesRes = await fetch('/api/branch-balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            let balancesData = []
            if (balancesRes.ok) {
                const balancesJson = await balancesRes.json()
                // Handle both paginated and non-paginated responses
                balancesData = Array.isArray(balancesJson) ? balancesJson : (balancesJson.data || [])
            }

            // Merge branch and balance data
            const mergedData = branchesData.map((branch: any) => {
                const balance = balancesData.find((b: any) => b.branchId === branch.branchId)
                return {
                    ...branch,
                    branchBalance: balance ? {
                        id: balance.id,
                        openingBalance: Number(balance.openingBalance),
                        currentBalance: Number(balance.currentBalance),
                        totalIssued: Number(balance.totalIssued),
                        totalRetired: Number(balance.totalRetired)
                    } : null
                }
            })

            setBranches(mergedData)
        } catch (error) {
            console.error('Error fetching branches:', error)
            setError('Failed to load branches')
        } finally {
            setLoading(false)
        }
    }

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setSuccess('')

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/branches', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    branchName,
                    branchCode
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to add branch')
            }

            // Refresh list
            await fetchBranches()
            setBranchName('')
            setBranchCode('')
            setShowAddForm(false)
            setSuccess('Branch created successfully!')
            setTimeout(() => setSuccess(''), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleSetBalance = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBranch) return

        setBalanceSubmitting(true)
        setError('')

        try {
            const token = localStorage.getItem('token')
            const amount = Number(balanceAmount)

            if (amount <= 0) {
                throw new Error('Amount must be greater than 0')
            }

            const url = selectedBranch.branchBalance
                ? `/api/branch-balance/${selectedBranch.branchId}`
                : '/api/branch-balance'

            const method = selectedBranch.branchBalance ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    branchId: selectedBranch.branchId,
                    amount,
                    notes: balanceNotes || undefined
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update balance')
            }

            setSuccess(selectedBranch.branchBalance ? 'Balance topped up successfully!' : 'Opening balance set successfully!')
            setTimeout(() => setSuccess(''), 3000)
            setShowBalanceModal(false)
            setBalanceAmount('')
            setBalanceNotes('')
            setSelectedBranch(null)
            await fetchBranches()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setBalanceSubmitting(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount)
    }

    const filteredBranches = branches.filter(branch =>
        branch.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branchCode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
                        <Building className="w-8 h-8 mr-3 text-[color:var(--accent)]" />
                        Branch Management
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] text-sm mt-1">Manage branches and their imprest balances</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center justify-center px-6 py-3 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg font-semibold shadow-lg hover:bg-[color:var(--accent)/.9] transition-all transform hover:scale-105 active:scale-95"
                >
                    {showAddForm ? 'Cancel' : (
                        <>
                            <Plus className="w-5 h-5 mr-2" />
                            Add Branch
                        </>
                    )}
                </button>
            </div>

            {/* Success/Error Messages */}
            {error && (
                <div className="p-3 bg-[color:var(--destructive)/.1] text-[color:var(--destructive)] rounded-lg flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                </div>
            )}

            {success && (
                <div className="p-3 bg-[color:var(--success)/.1] text-[color:var(--success)] rounded-lg flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {success}
                </div>
            )}

            {/* Add Branch Form */}
            {showAddForm && (
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <h2 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4 flex items-center">
                        <Building className="w-5 h-5 mr-2 text-[color:var(--accent)]" />
                        Add New Branch
                    </h2>

                    <form onSubmit={handleAddBranch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-1">
                                Branch Name <span className="text-[color:var(--destructive)]">*</span>
                            </label>
                            <input
                                type="text"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                className="w-full p-2 text-[color:var(--card-foreground)] bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)]"
                                placeholder="e.g. Lagos Main Branch"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-1">
                                Branch Code <span className="text-[color:var(--destructive)]">*</span>
                            </label>
                            <input
                                type="text"
                                value={branchCode}
                                onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                                className="w-full p-2 text-[color:var(--card-foreground)] bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] uppercase"
                                placeholder="e.g. LAG"
                                maxLength={10}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg hover:bg-[color:var(--accent)/.9] disabled:opacity-50 transition-colors"
                            >
                                {submitting ? 'Adding...' : 'Save Branch'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="bg-[color:var(--card)] p-4 rounded-xl shadow-sm border border-[color:var(--border)]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-[color:var(--card-foreground)] bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                    />
                </div>
            </div>

            {/* Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent)]"></div>
                    </div>
                ) : filteredBranches.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Building className="w-16 h-16 text-[color:var(--muted-foreground)] mx-auto mb-4" />
                        <p className="text-[color:var(--muted-foreground)]">No branches found</p>
                    </div>
                ) : (
                    filteredBranches.map((branch) => (
                        <div key={branch.branchId} className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] hover:shadow-md transition-shadow">
                            {/* Branch Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="p-3 bg-[color:var(--primary)/.2] rounded-lg mr-3">
                                        <Building className="w-6 h-6 text-[color:var(--primary)]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[color:var(--card-foreground)]">{branch.branchName}</h3>
                                        <p className="text-sm text-[color:var(--muted-foreground)]">{branch.branchCode}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Info */}
                            {branch.branchBalance ? (
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[color:var(--muted-foreground)]">Current Imprest Balance</span>
                                        <span className="font-bold text-lg text-[color:var(--primary)]">
                                            {formatCurrency(branch.branchBalance.currentBalance)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[color:var(--muted-foreground)]">Opening I Balance</span>
                                        <span className="font-semibold text-[color:var(--card-foreground)]">
                                            {formatCurrency(branch.branchBalance.openingBalance)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[color:var(--muted-foreground)]">Total Issued</span>
                                        <span className="text-sm text-[color:var(--destructive)]">
                                            {formatCurrency(branch.branchBalance.totalIssued)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-[color:var(--muted-foreground)]">Total Retired</span>
                                        <span className="text-sm text-[color:var(--success)]">
                                            {formatCurrency(branch.branchBalance.totalRetired)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 p-4 bg-[color:var(--muted)/.1] rounded-lg text-center">
                                    <Wallet className="w-8 h-8 text-[color:var(--muted-foreground)] mx-auto mb-2" />
                                    <p className="text-sm text-[color:var(--muted-foreground)]">No balance set</p>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={() => {
                                    setSelectedBranch(branch)
                                    setShowBalanceModal(true)
                                    setError('')
                                }}
                                className="w-full flex items-center justify-center px-4 py-2 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg hover:bg-[color:var(--accent)/.9] transition-colors active:scale-[0.98]"
                            >
                                {branch.branchBalance ? (
                                    <>
                                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                                        Top Up Balance
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Set Opening Balance
                                    </>
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Balance Modal */}
            {showBalanceModal && selectedBranch && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-xl max-w-md w-full">
                        <h2 className="text-xl font-bold text-[color:var(--card-foreground)] mb-4">
                            {selectedBranch.branchBalance ? 'Top Up Balance' : 'Set Opening Balance'}
                        </h2>
                        <p className="text-[color:var(--muted-foreground)] mb-4">
                            {selectedBranch.branchName} ({selectedBranch.branchCode})
                        </p>

                        {selectedBranch.branchBalance && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                                    Current Balance
                                </label>
                                <p className="text-2xl font-bold text-[color:var(--primary)]">
                                    {formatCurrency(selectedBranch.branchBalance.currentBalance)}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSetBalance}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                                    Amount <span className="text-[color:var(--destructive)]">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={balanceAmount}
                                    onChange={(e) => setBalanceAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                                    required
                                    min="1"
                                    step="0.01"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={balanceNotes}
                                    onChange={(e) => setBalanceNotes(e.target.value)}
                                    placeholder="Add notes about this transaction"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBalanceModal(false)
                                        setBalanceAmount('')
                                        setBalanceNotes('')
                                        setSelectedBranch(null)
                                        setError('')
                                    }}
                                    className="flex-1 px-4 py-2 bg-[color:var(--muted)/.2] text-[color:var(--card-foreground)] rounded-lg hover:bg-[color:var(--muted)/.3] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={balanceSubmitting}
                                    className="flex-1 px-4 py-2 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg hover:bg-[color:var(--accent)/.9] disabled:opacity-50 transition-colors active:scale-[0.98]"
                                >
                                    {balanceSubmitting ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}