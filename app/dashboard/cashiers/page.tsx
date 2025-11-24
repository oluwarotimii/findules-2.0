'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    Plus,
    Trash2,
    Search,
    Building,
    UserPlus,
    AlertCircle
} from 'lucide-react'

interface Cashier {
    id: string
    name: string
    branchId: string
    status: string
    branch: {
        branchName: string
    }
}

export default function CashiersPage() {
    const [cashiers, setCashiers] = useState<Cashier[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // New Cashier Form State
    const [newCashierName, setNewCashierName] = useState('')
    const [newCashierBranchId, setNewCashierBranchId] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [branches, setBranches] = useState<any[]>([])

    useEffect(() => {
        fetchCurrentUser()
        fetchCashiers()
        fetchBranches()
    }, [])

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/branches', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setBranches(data)
                // Set default to user's branch if available
                if (currentUser?.branchId) {
                    setNewCashierBranchId(currentUser?.branchId)
                }
            }
        } catch (error) {
            console.error('Error fetching branches:', error)
        }
    }

    const fetchCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCurrentUser(data)
            }
        } catch (err) {
            console.error('Error fetching user:', err)
        }
    }

    const fetchCashiers = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/cashiers', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setCashiers(data)
            }
        } catch (error) {
            console.error('Error fetching cashiers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddCashier = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        if (!newCashierBranchId) {
            setError('Please select a branch for this cashier')
            setSubmitting(false)
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/cashiers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newCashierName,
                    branchId: newCashierBranchId
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to add cashier')
            }

            // Refresh list
            await fetchCashiers()
            setNewCashierName('')
            setNewCashierBranchId(currentUser?.branchId || '') // Reset to user's branch
            setShowAddForm(false)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteCashier = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this cashier?')) return

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/cashiers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                fetchCashiers()
            } else {
                alert('Failed to deactivate cashier')
            }
        } catch (error) {
            console.error('Error deleting cashier:', error)
        }
    }

    const filteredCashiers = cashiers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        c.status === 'ACTIVE'
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Cashiers</h1>
                    <p className="text-gray-500 text-sm">Add and manage cashier profiles for reconciliation</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showAddForm ? 'Cancel' : (
                        <>
                            <Plus className="w-5 h-5 mr-2" />
                            Add Cashier
                        </>
                    )}
                </button>
            </div>

            {/* Add Cashier Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
                        Add New Cashier
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAddCashier} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cashier Name</label>
                            <input
                                type="text"
                                value={newCashierName}
                                onChange={(e) => setNewCashierName(e.target.value)}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <select
                                value={newCashierBranchId}
                                onChange={(e) => setNewCashierBranchId(e.target.value)}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select a branch</option>
                                {branches.map(branch => (
                                    <option key={branch.branchId} value={branch.branchId}>
                                        {branch.branchName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Save Cashier'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search cashiers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Branch</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : filteredCashiers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No active cashiers found.</td>
                            </tr>
                        ) : (
                            filteredCashiers.map((cashier) => (
                                <tr key={cashier.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        {cashier.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center">
                                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                                            {cashier.branch.branchName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteCashier(cashier.id)}
                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Deactivate"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
