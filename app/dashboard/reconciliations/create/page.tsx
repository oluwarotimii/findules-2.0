'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Save,
    Calculator,
    AlertCircle,
    CheckCircle,
    Banknote,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Info
} from 'lucide-react'

export default function CreateReconciliationPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        cashierId: '',

        // Opening
        expectedOpeningBalance: '',
        actualOpeningBalance: '',
        openingVarianceExplanation: '',

        // Sales
        expectedTotalSales: '',
        posTransactionsAmount: '',
        cashSales: '',

        // Adjustments
        discountsGiven: '',
        refundsIssued: '',

        // Outflows
        cashWithdrawn: '',
        transfersOut: '',

        // Bank Deposit
        tellerNo: '',
        bankName: '',
        branchLocation: '',
        depositSlipNo: '',

        // Closing
        actualClosingBalance: '',

        // Remarks
        remarks: '',
    })

    // Calculated Values
    const [calculations, setCalculations] = useState({
        openingVariance: 0,
        actualTotalSales: 0,
        expectedClosingBalance: 0,
        overageShortage: 0
    })

    const [cashiers, setCashiers] = useState<{ id: string, name: string }[]>([])
    const [previousBalance, setPreviousBalance] = useState<{
        hasHistory: boolean
        previousClosingBalance: number | null
        previousDate?: string
        previousSerialNumber?: string
    } | null>(null)
    const [loadingPreviousBalance, setLoadingPreviousBalance] = useState(false)

    useEffect(() => {
        const fetchCashiers = async () => {
            try {
                const token = localStorage.getItem('token')
                const res = await fetch('/api/cashiers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setCashiers(data)
                }
            } catch (err) {
                console.error('Error fetching cashiers:', err)
            }
        }
        fetchCashiers()
    }, [])

    // Fetch previous closing balance when cashier or date changes
    useEffect(() => {
        const fetchPreviousBalance = async () => {
            if (!formData.cashierId || !formData.date) {
                setPreviousBalance(null)
                return
            }

            setLoadingPreviousBalance(true)
            try {
                const token = localStorage.getItem('token')
                const res = await fetch(
                    `/api/reconciliations/previous-balance?cashierId=${formData.cashierId}&date=${formData.date}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                )
                if (res.ok) {
                    const data = await res.json()
                    setPreviousBalance(data)

                    // Auto-populate expected opening balance if previous balance exists
                    if (data.hasHistory && data.previousClosingBalance !== null) {
                        setFormData(prev => ({
                            ...prev,
                            expectedOpeningBalance: data.previousClosingBalance
                        }))
                    } else {
                        // Reset to 0 if no previous balance
                        setFormData(prev => ({
                            ...prev,
                            expectedOpeningBalance: 0
                        }))
                    }
                }
            } catch (err) {
                console.error('Error fetching previous balance:', err)
            } finally {
                setLoadingPreviousBalance(false)
            }
        }

        fetchPreviousBalance()
    }, [formData.cashierId, formData.date])

    // Handle Input Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }



    // Auto-Calculations
    useEffect(() => {
        const {
            expectedOpeningBalance,
            actualOpeningBalance,
            posTransactionsAmount,
            cashSales,
            cashWithdrawn,
            transfersOut,
            actualClosingBalance
        } = formData

        // 1. Opening Variance
        const openingVariance = actualOpeningBalance - expectedOpeningBalance

        // 2. Actual Total Sales
        const actualTotalSales = cashSales + posTransactionsAmount

        // 3. Expected Closing Balance
        // Formula: Actual Opening + Cash Sales - Cash Withdrawn - Transfers Out
        const expectedClosingBalance = actualOpeningBalance + cashSales - cashWithdrawn - transfersOut

        // 4. Overage/Shortage
        const overageShortage = actualClosingBalance - expectedClosingBalance

        setCalculations({
            openingVariance,
            actualTotalSales,
            expectedClosingBalance,
            overageShortage
        })

    }, [formData])



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/reconciliations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to submit reconciliation')
            }

            router.push('/dashboard/reconciliations')
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
        <div className="max-w-5xl mx-auto">
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
                        <h1 className="text-2xl font-bold text-gray-800">New Reconciliation</h1>
                        <p className="text-gray-500 text-sm">Daily Cashier Reconciliation Form</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Basic Details */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                        Basic Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cashier</label>
                            <p className="text-xs text-gray-500 mb-2">Select the cashier for this reconciliation</p>
                            <select
                                name="cashierId"
                                value={formData.cashierId}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select Cashier</option>
                                {cashiers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <p className="text-xs text-gray-500 mb-2">Date of this reconciliation</p>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Opening Balance */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <ArrowDownRight className="w-5 h-5 mr-2 text-green-600" />
                        Opening Balance
                    </h2>

                    {/* Info message about auto-population */}
                    {loadingPreviousBalance && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center text-blue-700 text-sm">
                            <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                            Loading previous closing balance...
                        </div>
                    )}

                    {previousBalance?.hasHistory && !loadingPreviousBalance && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 text-sm">
                            <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>
                                Expected opening balance auto-filled from previous reconciliation (
                                <strong>{previousBalance.previousSerialNumber}</strong> on{' '}
                                <strong>{new Date(previousBalance.previousDate!).toLocaleDateString()}</strong>
                                )
                            </span>
                        </div>
                    )}

                    {previousBalance && !previousBalance.hasHistory && !loadingPreviousBalance && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center text-yellow-700 text-sm">
                            <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                            No previous reconciliation found for this cashier. Please enter the opening balance manually.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Opening (₦)
                                {previousBalance?.hasHistory && (
                                    <span className="ml-1 text-xs text-green-600">(Auto-filled)</span>
                                )}
                            </label>
                            <input
                                type="number"
                                name="expectedOpeningBalance"
                                value={formData.expectedOpeningBalance}
                                onChange={handleChange}
                                className={`w-full p-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${previousBalance?.hasHistory
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-300'
                                    }`}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Opening (₦)</label>
                            <input
                                type="number"
                                name="actualOpeningBalance"
                                value={formData.actualOpeningBalance}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className={`p-4 rounded-lg ${calculations.openingVariance === 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Opening Variance</label>
                            <p className="text-xl font-bold">{formatCurrency(calculations.openingVariance)}</p>
                        </div>
                    </div>
                    {calculations.openingVariance !== 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Variance Explanation</label>
                            <textarea
                                name="openingVarianceExplanation"
                                value={formData.openingVarianceExplanation}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={2}
                                placeholder="Explain why the opening balance differs from expected..."
                                required
                            />
                        </div>
                    )}
                </section>

                {/* 3. Sales & Revenue */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Banknote className="w-5 h-5 mr-2 text-blue-600" />
                        Sales & Revenue
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash Sales (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Total cash sales for the day</p>
                            <input
                                type="number"
                                name="cashSales"
                                value={formData.cashSales}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">POS Transactions (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Total POS/card transactions</p>
                            <input
                                type="number"
                                name="posTransactionsAmount"
                                value={formData.posTransactionsAmount}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Total Sales (System) (₦)</label>
                            <input
                                type="number"
                                name="expectedTotalSales"
                                value={formData.expectedTotalSales}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Actual Total Sales (Calc)</label>
                            <p className="text-xl font-bold">{formatCurrency(calculations.actualTotalSales)}</p>
                        </div>
                    </div>
                </section>

                {/* 4. Cash Outflows */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <ArrowUpRight className="w-5 h-5 mr-2 text-red-600" />
                        Cash Outflows
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash Withdrawn / Expenses (₦)</label>
                            <input
                                type="number"
                                name="cashWithdrawn"
                                value={formData.cashWithdrawn}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transfers Out (₦)</label>
                            <input
                                type="number"
                                name="transfersOut"
                                value={formData.transfersOut}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>
                </section>

                {/* 5. Bank Deposit */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                        Bank Deposit Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. First Bank"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teller / Slip Number</label>
                            <input
                                type="text"
                                name="tellerNo"
                                value={formData.tellerNo}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </section>



                {/* 7. Closing & Variance */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                        Closing Analysis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-gray-500">Expected Closing</label>
                            <p className="text-xl font-bold text-gray-800">{formatCurrency(calculations.expectedClosingBalance)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Closing Balance (₦)</label>
                            <input
                                type="number"
                                name="actualClosingBalance"
                                value={formData.actualClosingBalance}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className={`p-4 rounded-lg ${Math.abs(calculations.overageShortage) < 100 ? 'bg-green-100 text-green-800' :
                            calculations.overageShortage < 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Variance</label>
                            <p className="text-xl font-bold">{formatCurrency(calculations.overageShortage)}</p>
                            <p className="text-xs mt-1 font-medium">
                                {Math.abs(calculations.overageShortage) < 100 ? 'Balanced' :
                                    calculations.overageShortage < 0 ? 'Shortage' : 'Overage'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 8. Remarks */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Remarks</h2>
                    <textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        className="w-full p-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Any additional notes or explanations..."
                    />
                </section>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="w-5 h-5 mr-2" />
                        )}
                        Submit Reconciliation
                    </button>
                </div>
            </form>
        </div>
    )
}
