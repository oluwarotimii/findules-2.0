'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Wallet, AlertCircle, Plus, X } from 'lucide-react'

export default function IssueImprestPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [categories] = useState(['TRANSPORT', 'MEALS', 'SUPPLIES', 'OTHER'])

    const [formData, setFormData] = useState({
        staffName: '',
        amount: '',
        category: 'TRANSPORT',
        purpose: '',
        dateIssued: new Date().toISOString().split('T')[0]
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/imprest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to issue imprest')
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

    return (
        <div className="max-w-3xl mx-auto text-[color:var(--card-foreground)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-[color:var(--muted)/.2] rounded-lg transition-colors text-[color:var(--card-foreground)]"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
                            <Wallet className="w-7 h-7 mr-2 text-[color:var(--accent)]" />
                            Issue Imprest
                        </h1>
                        <p className="text-[color:var(--muted-foreground)] text-sm">Issue cash advance to staff</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-[color:var(--destructive)/.1] border border-[color:var(--destructive)] rounded-lg flex items-center text-[color:var(--destructive)]">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Details */}
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <h2 className="text-lg font-semibold text-[color:var(--card-foreground)] mb-4">Imprest Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-1">
                                Staff Name *
                            </label>
                            <p className="text-xs text-[color:var(--muted-foreground)] mb-2">Full name of the staff member receiving the imprest</p>
                            <input
                                type="text"
                                name="staffName"
                                value={formData.staffName}
                                onChange={handleChange}
                                className="w-full p-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                                required
                                placeholder="Enter staff name"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-1">
                                    Amount (₦) *
                                </label>
                                <p className="text-xs text-[color:var(--muted-foreground)] mb-2">Total amount to be issued as imprest</p>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                                    required
                                    min="1"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                                {formData.amount && parseFloat(formData.amount as string) > 0 && (
                                    <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
                                        {formatCurrency(parseFloat(formData.amount as string))}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-1">
                                    Category *
                                </label>
                                <p className="text-xs text-[color:var(--muted-foreground)] mb-2">Select the purpose category for this imprest</p>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} className="bg-[color:var(--card)] text-[color:var(--card-foreground)]">{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-1">
                                Date Issued *
                            </label>
                            <p className="text-xs text-[color:var(--muted-foreground)] mb-2">Date when the imprest is being issued</p>
                            <input
                                type="date"
                                name="dateIssued"
                                value={formData.dateIssued}
                                onChange={handleChange}
                                className="w-full p-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-1">
                                Purpose *
                            </label>
                            <p className="text-xs text-[color:var(--muted-foreground)] mb-2">Detailed description of what the imprest will be used for</p>
                            <textarea
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                className="w-full p-3 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                                rows={4}
                                required
                                placeholder="Describe the purpose of this imprest..."
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 border border-[color:var(--border)] text-[color:var(--card-foreground)] rounded-lg font-semibold hover:bg-[color:var(--muted)/.2] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center px-8 py-3 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg font-semibold shadow-lg hover:bg-[color:var(--accent)/.9] transition-all transform hover:scale-105 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[color:var(--accent-foreground)] mr-2"></div>
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Issue Imprest
                    </button>
                </div>
            </form>

        </div>
    )
}
