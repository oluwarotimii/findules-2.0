'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Fuel } from 'lucide-react'

export default function CreateFuelCouponPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        staffName: '',
        department: '',
        unit: '',
        vehicleType: '',
        plateNumber: '',
        purpose: '',
        fuelType: 'PETROL',
        quantityLitres: '',
        estimatedAmount: ''
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
            const response = await fetch('/api/fuel-coupons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create fuel coupon')
            }

            const coupon = await response.json()

            // Auto-download PDF
            try {
                const pdfRes = await fetch(`/api/fuel-coupons/${coupon.documentCode}/pdf`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (pdfRes.ok) {
                    const blob = await pdfRes.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${coupon.documentCode}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)

                    // Also open for printing
                    window.open(url, '_blank')

                    setTimeout(() => window.URL.revokeObjectURL(url), 100)
                }
            } catch (pdfError) {
                console.error('PDF download error:', pdfError)
            }

            router.push('/dashboard/fuel-coupons')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Fuel className="w-7 h-7 mr-2 text-blue-600" />
                        Create Fuel Coupon
                    </h1>
                    <p className="text-gray-500 text-sm">Generate fuel authorization coupon</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Staff Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <p className="text-xs text-gray-500 mb-2">Date when the fuel coupon is being issued</p>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name *</label>
                            <p className="text-xs text-gray-500 mb-2">Full name of the staff member receiving the fuel coupon</p>
                            <input type="text" name="staffName" value={formData.staffName} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <p className="text-xs text-gray-500 mb-2">Department or unit the staff belongs to</p>
                            <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <p className="text-xs text-gray-500 mb-2">Specific unit within the department (optional)</p>
                            <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                            <p className="text-xs text-gray-500 mb-2">Make and model of the vehicle (e.g., Toyota Hilux)</p>
                            <input type="text" name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" placeholder="e.g., Toyota Hilux" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                            <p className="text-xs text-gray-500 mb-2">Vehicle registration number</p>
                            <input type="text" name="plateNumber" value={formData.plateNumber} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" placeholder="e.g., ABC-123-XY" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Fuel Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type *</label>
                            <p className="text-xs text-gray-500 mb-2">Select the type of fuel required</p>
                            <select name="fuelType" value={formData.fuelType} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" required>
                                <option value="PETROL">Petrol</option>
                                <option value="DIESEL">Diesel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Litres) *</label>
                            <p className="text-xs text-gray-500 mb-2">Amount of fuel in litres</p>
                            <input type="number" name="quantityLitres" value={formData.quantityLitres} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" required min="1" step="0.01" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Amount (₦)</label>
                            <p className="text-xs text-gray-500 mb-2">Estimated cost (optional)</p>
                            <input type="number" name="estimatedAmount" value={formData.estimatedAmount} onChange={handleChange} className="w-full p-2 border rounded-lg text-gray-900" min="0" step="0.01" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                        <p className="text-xs text-gray-500 mb-2">Describe the purpose of this fuel request</p>
                        <textarea name="purpose" value={formData.purpose} onChange={handleChange} className="w-full p-3 border rounded-lg text-gray-900" rows={3} placeholder="Purpose of fuel request..." />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 border text-gray-700 rounded-lg font-semibold hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className={`flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700 ${loading ? 'opacity-70' : ''}`}>
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> : <Save className="w-5 h-5 mr-2" />}
                        Create & Download PDF
                    </button>
                </div>
            </form>
        </div>
    )
}
