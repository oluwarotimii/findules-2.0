'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    Plus,
    TrendingUp,
    Building,
    ArrowUpCircle,
    DollarSign
} from 'lucide-react'

interface BranchBalance {
    id: string
    branchId: string
    openingBalance: number
    currentBalance: number
    totalIssued: number
    totalRetired: number
    branch: {
        branchName: string
        branchCode: string
        location?: string
    }
}

export default function BranchBalancePage() {
    const router = useRouter()
    const [branchBalances, setBranchBalances] = useState<BranchBalance[]>([])
    const [loading, setLoading] = useState(true)
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState<BranchBalance | null>(null)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        fetchBranchBalances()
    }, [])

    const fetchBranchBalances = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/branch-balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setBranchBalances(data.map((item: any) => ({
                    ...item,
                    openingBalance: Number(item.openingBalance),
                    currentBalance: Number(item.currentBalance),
                    totalIssued: Number(item.totalIssued),
                    totalRetired: Number(item.totalRetired)
                })))
            }
        } catch (error) {
            console.error('Error fetching branch balances:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTopUp = async () => {
        if (!selectedBranch || !topUpAmount || Number(topUpAmount) <= 0) {
            alert('Please enter a valid amount')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/branch-balance/${selectedBranch.branchId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: Number(topUpAmount),
                    notes
                })
            })

            if (res.ok) {
                alert('Branch balance topped up successfully')
                setShowTopUpModal(false)
                setTopUpAmount('')
                setNotes('')
                setSelectedBranch(null)
                fetchBranchBalances()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to top up balance')
            }
        } catch (error) {
            console.error('Error topping up balance:', error)
            alert('Failed to top up balance')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount)
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
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
                        <Wallet className="w-8 h-8 mr-3 text-[color:var(--accent)]" />
                        Branch Balance Management
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] text-sm mt-1">Manage opening balances and top-ups for all branches</p>
                </div>
            </div>

            {/* Branch Balances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branchBalances.map((branchBalance) => (
                    <div key={branchBalance.id} className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] hover:shadow-md transition-shadow">
                        {/* Branch Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                                <div className="p-3 bg-[color:var(--primary)/.2] rounded-lg mr-3">
                                    <Building className="w-6 h-6 text-[color:var(--primary)]" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[color:var(--card-foreground)]">{branchBalance.branch.branchName}</h3>
                                    <p className="text-sm text-[color:var(--muted-foreground)]">{branchBalance.branch.branchCode}</p>
                                </div>
                            </div>
                        </div>

                        {/* Balance Details */}
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[color:var(--muted-foreground)]">Opening Balance</span>
                                <span className="font-semibold text-[color:var(--card-foreground)]">
                                    {formatCurrency(branchBalance.openingBalance)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[color:var(--muted-foreground)]">Current Balance</span>
                                <span className="font-bold text-lg text-[color:var(--primary)]">
                                    {formatCurrency(branchBalance.currentBalance)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[color:var(--muted-foreground)]">Total Issued</span>
                                <span className="text-sm text-[color:var(--destructive)]">
                                    {formatCurrency(branchBalance.totalIssued)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[color:var(--muted-foreground)]">Total Retired</span>
                                <span className="text-sm text-[color:var(--success)]">
                                    {formatCurrency(branchBalance.totalRetired)}
                                </span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => {
                                setSelectedBranch(branchBalance)
                                setShowTopUpModal(true)
                            }}
                            className="w-full flex items-center justify-center px-4 py-2 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg hover:bg-[color:var(--accent)/.9] transition-colors"
                        >
                            <ArrowUpCircle className="w-4 h-4 mr-2" />
                            Top Up Balance
                        </button>
                    </div>
                ))}
            </div>

            {/* Top Up Modal */}
            {showTopUpModal && selectedBranch && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold text-[color:var(--card-foreground)] mb-4">
                            Top Up Branch Balance
                        </h2>
                        <p className="text-[color:var(--muted-foreground)] mb-4">
                            {selectedBranch.branch.branchName} ({selectedBranch.branch.branchCode})
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                                Current Balance
                            </label>
                            <p className="text-2xl font-bold text-[color:var(--primary)]">
                                {formatCurrency(selectedBranch.currentBalance)}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                                Top Up Amount *
                            </label>
                            <input
                                type="number"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes about this top-up"
                                rows={3}
                                className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowTopUpModal(false)
                                    setTopUpAmount('')
                                    setNotes('')
                                    setSelectedBranch(null)
                                }}
                                className="flex-1 px-4 py-2 border border-[color:var(--border)] text-[color:var(--card-foreground)] rounded-lg hover:bg-[color:var(--muted)/.2]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTopUp}
                                className="flex-1 px-4 py-2 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg hover:bg-[color:var(--accent)/.9]"
                            >
                                Confirm Top Up
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
