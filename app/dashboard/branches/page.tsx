'use client'

import { useState, useEffect } from 'react'
import {
    Building,
    Plus,
    Trash2,
    Search,
    AlertCircle,
    CheckCircle
} from 'lucide-react'

interface Branch {
    branchId: string
    branchName: string
    branchCode: string
}

export default function BranchManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    
    // New Branch Form State
    const [branchName, setBranchName] = useState('')
    const [branchCode, setBranchCode] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
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
            }
        } catch (error) {
            console.error('Error fetching branches:', error)
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
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
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
                    <h1 className="text-2xl font-bold text-gray-800">Branch Management</h1>
                    <p className="text-gray-500 text-sm">Create and manage branches for your organization</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showAddForm ? 'Cancel' : (
                        <>
                            <Plus className="w-5 h-5 mr-2" />
                            Add Branch
                        </>
                    )}
                </button>
            </div>

            {/* Add Branch Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Building className="w-5 h-5 mr-2 text-blue-600" />
                        Add New Branch
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleAddBranch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Lagos Main Branch"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={branchCode}
                                onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                                placeholder="e.g. LAG"
                                maxLength={10}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Save Branch'}
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
                        placeholder="Search branches..."
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
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Branch Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Branch Code</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Branch ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                            </tr>
                        ) : filteredBranches.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No branches found.</td>
                            </tr>
                        ) : (
                            filteredBranches.map((branch) => (
                                <tr key={branch.branchId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        {branch.branchName}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                                            {branch.branchCode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm font-mono">
                                        {branch.branchId}
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