'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Wallet, AlertCircle, Info } from 'lucide-react'

interface Imprest {
    imprestNo: string
    staffName: string
    amount: number
    category: string
    purpose: string
    dateIssued: string
    status: string
}

export default function RetireImprestPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetchingImprest, setFetchingImprest] = useState(true)
    const [error, setError] = useState('')
    const [imprest, setImprest] = useState<Imprest | null>(null)
    const [imprestId, setImprestId] = useState<string>('')

    const [formData, setFormData] = useState({
        amountSpent: 0,
        receipts: '',
        retirementNotes: '',
        dateRetired: new Date().toISOString().split('T')[0]
    })

    const [balance, setBalance] = useState(0)

    useEffect(() => {
        params.then(p => {
            setImprestId(p.id)
        })
    }, [])

    useEffect(() => {
        if (imprestId) {
            fetchImprest()
        }
    }, [imprestId])

    useEffect(() => {
        if (imprest) {
            setBalance(imprest.amount - formData.amountSpent)
        }
    }, [formData.amountSpent, imprest])

    const fetchImprest = async () => {
        if (!imprestId) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/imprest/${imprestId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setImprest(data)
            } else {
                setError('Imprest not found')
            }
        } catch (error) {
            console.error('Error fetching imprest:', error)
            setError('Failed to load imprest')
        } finally {
            setFetchingImprest(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validation
        if (formData.amountSpent > (imprest?.amount || 0)) {
            setError('Amount spent cannot exceed amount issued')
            setLoading(false)
            return
        }

        if (formData.amountSpent < 0) {
            setError('Amount spent cannot be negative')
            setLoading(false)
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/imprest/${imprestId}/retire`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to retire imprest')
            }

            router.push('/dashboard/imprest')
        } catch (err: any) {
            setError(err.message)
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

    if (fetchingImprest) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        )
    }

    if (!imprest) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">{error || 'Imprest not found'}</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <Wallet className="w-7 h-7 mr-2 text-orange-600" />
                            Retire Imprest
                        </h1>
                        <p className="text-gray-500 text-sm">Process imprest retirement and collect change</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {/* Original Imprest Details */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm border border-orange-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-orange-600" />
                    Original Imprest Details
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Imprest No</p>
                        <p className="font-semibold text-gray-900">{imprest.imprestNo}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Staff Name</p>
                        <p className="font-semibold text-gray-900">{imprest.staffName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Amount Issued</p>
                        <p className="font-semibold text-orange-600 text-lg">{formatCurrency(imprest.amount)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-semibold text-gray-900">{imprest.category}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Date Issued</p>
                        <p className="font-semibold text-gray-900">
                            {new Date(imprest.dateIssued).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-sm text-gray-600">Purpose</p>
                    <p className="text-gray-900">{imprest.purpose}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Retirement Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Retirement Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount Spent (₦) *
                            </label>
                            <input
                                type="number"
                                name="amountSpent"
                                value={formData.amountSpent}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
                                min="0"
                                max={imprest.amount}
                                step="0.01"
                            />
                            {formData.amountSpent > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {formatCurrency(formData.amountSpent)}
                                </p>
                            )}
                        </div>

                        {/* Balance Display */}
                        <div className={`p-4 rounded-lg ${balance > 0 ? 'bg-green-50 border border-green-200' : balance < 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Balance / Change to Return
                            </label>
                            <p className={`text-2xl font-bold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {formatCurrency(balance)}
                            </p>
                            {balance > 0 && (
                                <p className="text-sm text-green-700 mt-1">Staff should return this amount</p>
                            )}
                            {balance < 0 && (
                                <p className="text-sm text-red-700 mt-1">⚠️ Amount spent exceeds amount issued!</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Retired *
                            </label>
                            <input
                                type="date"
                                name="dateRetired"
                                value={formData.dateRetired}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Receipt Details
                            </label>
                            <textarea
                                name="receipts"
                                value={formData.receipts}
                                onChange={handleChange}
                                className="w-full p-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                rows={3}
                                placeholder="List receipt numbers or details..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Retirement Notes
                            </label>
                            <textarea
                                name="retirementNotes"
                                value={formData.retirementNotes}
                                onChange={handleChange}
                                className="w-full p-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                rows={3}
                                placeholder="Any additional notes about this retirement..."
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || balance < 0}
                        className={`flex items-center px-8 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 ${(loading || balance < 0) ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Retire Imprest
                    </button>
                </div>
            </form>
        </div>
    )
}
