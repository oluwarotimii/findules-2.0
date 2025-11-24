'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Wallet, AlertCircle, Plus, X } from 'lucide-react'

export default function IssueImprestPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [newCategory, setNewCategory] = useState('')
    const [categories, setCategories] = useState(['TRANSPORT', 'MEALS', 'SUPPLIES', 'OTHER'])

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

    const handleAddCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim().toUpperCase())) {
            const upperCategory = newCategory.trim().toUpperCase()
            setCategories([...categories, upperCategory])
            setFormData(prev => ({ ...prev, category: upperCategory }))
            setNewCategory('')
            setShowCategoryModal(false)
        }
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
                            Issue Imprest
                        </h1>
                        <p className="text-gray-500 text-sm">Issue cash advance to staff</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Imprest Details</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Staff Name *
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Full name of the staff member receiving the imprest</p>
                            <input
                                type="text"
                                name="staffName"
                                value={formData.staffName}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
                                placeholder="Enter staff name"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (₦) *
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Total amount to be issued as imprest</p>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                    min="1"
                                    step="0.01"
                                    placeholder="0.00"
                                />
                                {formData.amount && parseFloat(formData.amount as string) > 0 && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {formatCurrency(parseFloat(formData.amount as string))}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Category *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryModal(true)}
                                        className="flex items-center text-xs text-orange-600 hover:text-orange-700 font-medium"
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Category
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">Select the purpose category for this imprest</p>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Issued *
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Date when the imprest is being issued</p>
                            <input
                                type="date"
                                name="dateIssued"
                                value={formData.dateIssued}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purpose *
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Detailed description of what the imprest will be used for</p>
                            <textarea
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                className="w-full p-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center px-8 py-3 bg-orange-600 text-white rounded-lg font-semibold shadow-lg hover:bg-orange-700 transition-all transform hover:scale-105 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Issue Imprest
                    </button>
                </div>
            </form>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Add New Category</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g., UTILITIES"
                                autoFocus
                            />
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                            >
                                Add Category
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
