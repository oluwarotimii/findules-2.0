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

        // Opening (auto-fetched from previous day)
        actualOpeningBalance: '',

        // Sales (from Busy Accounting Software)
        totalSales: '',

        // Cashier Record Breakdown (all recorded in cashier's book)
        posTransactionsAmount: '',
        cashTransaction: '', // New field
        transfersIn: '',
        transfersOut: '',
        discountsGiven: '',
        refundsIssued: '',

        // Withdrawals
        cashWithdrawn: '',
        withdrawalRecipient: '',
        withdrawalDetails: '',

        // Physical Count
        cashAtHand: '',

        // Bank Deposit
        tellerNo: '',
        bankName: '',
        branchLocation: '',
        depositSlipNo: '',

        // Remarks
        remarks: '',
    })

    // Calculated Values
    const [calculations, setCalculations] = useState({
        openingVariance: 0,
        actualTotalSales: 0,
        turnover: 0,
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

                    // Auto-populate actual opening balance if previous balance exists
                    if (data.hasHistory && data.previousClosingBalance !== null) {
                        setFormData(prev => ({
                            ...prev,
                            actualOpeningBalance: String(data.previousClosingBalance)
                        }))
                    } else {
                        // Reset to empty if no previous balance
                        setFormData(prev => ({
                            ...prev,
                            actualOpeningBalance: ''
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
            actualOpeningBalance,
            totalSales,
            posTransactionsAmount,
            cashTransaction,
            transfersIn,
            transfersOut,
            discountsGiven,
            refundsIssued,
            cashWithdrawn,
            cashAtHand
        } = formData

        // Helper to safely parse numbers
        const parseNum = (val: string | number): number => {
            if (typeof val === 'number') return val
            const parsed = parseFloat(val)
            return isNaN(parsed) ? 0 : parsed
        }

        // 1. Turnover = Opening Balance + Total Sales
        const turnover = parseNum(actualOpeningBalance) + parseNum(totalSales)

        // 2. Expected Closing Balance = Turnover - ALL Cashier Record Breakdown Items - Withdrawals
        // Cashier Record Breakdown: POS, Transfers In, Transfers Out, Discounts, Refunds (ALL subtracted)
        const expectedClosingBalance = turnover
            - parseNum(posTransactionsAmount)
            - parseNum(transfersIn)
            - parseNum(transfersOut)
            - parseNum(discountsGiven)
            - parseNum(refundsIssued)
            - parseNum(cashWithdrawn)
        // cashTransaction is EXCLUDED from deductions as per requirement

        // 3. Variance = Cash at Hand - Expected Closing
        const overageShortage = parseNum(cashAtHand) - expectedClosingBalance

        setCalculations({
            openingVariance: 0, // No longer used
            actualTotalSales: parseNum(totalSales), // For display
            turnover,
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
                                Opening balance auto-filled from previous reconciliation (
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Balance (₦)
                                {previousBalance?.hasHistory && (
                                    <span className="ml-1 text-xs text-green-600">(Auto-filled)</span>
                                )}
                            </label>
                            <p className="text-xs text-gray-500 mb-2">From previous day's closing balance</p>
                            <input
                                type="number"
                                name="actualOpeningBalance"
                                value={formData.actualOpeningBalance}
                                onChange={handleChange}
                                className={`w-full p-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${previousBalance?.hasHistory
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-gray-300'
                                    }`}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                </section>

                {/* 3. Sales & Turnover */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Banknote className="w-5 h-5 mr-2 text-blue-600" />
                        Sales & Turnover
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Sales (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">From Busy Accounting Software</p>
                            <input
                                type="number"
                                name="totalSales"
                                value={formData.totalSales}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="p-4 bg-purple-50 text-purple-700 rounded-lg">
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1">Turnover (Calc)</label>
                            <p className="text-xl font-bold">{formatCurrency(calculations.turnover)}</p>
                            <p className="text-xs mt-1 opacity-75">Opening Balance + Total Sales</p>
                        </div>
                    </div>
                </section>

                {/* 4. Cashier Record Breakdown */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Calculator className="w-5 h-5 mr-2 text-indigo-600" />
                        Cashier Record Breakdown
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">All items recorded in the cashier's book (all subtracted from turnover)</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash Transaction (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Cash transactions (Not deducted from turnover)</p>
                            <input
                                type="number"
                                name="cashTransaction"
                                value={formData.cashTransaction}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transfers In (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Money received from other accounts</p>
                            <input
                                type="number"
                                name="transfersIn"
                                value={formData.transfersIn}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transfers Out (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Money transferred out to other accounts</p>
                            <input
                                type="number"
                                name="transfersOut"
                                value={formData.transfersOut}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discounts Given (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Total discounts provided to customers</p>
                            <input
                                type="number"
                                name="discountsGiven"
                                value={formData.discountsGiven}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Refunds Issued (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Total refunds given to customers</p>
                            <input
                                type="number"
                                name="refundsIssued"
                                value={formData.refundsIssued}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </section>

                {/* 5. Withdrawals & Expenses */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <ArrowUpRight className="w-5 h-5 mr-2 text-red-600" />
                        Withdrawals & Expenses
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash Withdrawn / Expenses (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Cash withdrawn or expenses paid</p>
                            <input
                                type="number"
                                name="cashWithdrawn"
                                value={formData.cashWithdrawn}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Withdrawal Details - Show when cash withdrawn > 0 */}
                    {parseFloat(formData.cashWithdrawn || '0') > 0 && (
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                                <p className="text-xs text-gray-500 mb-2">Name of person who collected the cash</p>
                                <input
                                    type="text"
                                    name="withdrawalRecipient"
                                    value={formData.withdrawalRecipient}
                                    onChange={handleChange}
                                    className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter recipient's full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Details</label>
                                <p className="text-xs text-gray-500 mb-2">Provide details about withdrawals and expenses</p>
                                <textarea
                                    name="withdrawalDetails"
                                    value={formData.withdrawalDetails}
                                    onChange={handleChange}
                                    className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Describe the purpose of withdrawals or expenses..."
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* 6. Bank Deposit */}
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
                            <p className="text-xs mt-1 text-gray-600">Turnover - All Deductions</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cash at Hand (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Physical cash count</p>
                            <input
                                type="number"
                                name="cashAtHand"
                                value={formData.cashAtHand}
                                onChange={handleChange}
                                className="w-full p-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                required
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
