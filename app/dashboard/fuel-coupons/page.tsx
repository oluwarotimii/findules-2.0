'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Fuel, Plus, Search, Download, Trash2, FileText, Eye, X, Printer } from 'lucide-react'

interface FuelCoupon {
    documentCode: string
    date: string
    staffName: string
    department: string
    vehicleType?: string
    plateNumber?: string
    fuelType: 'PETROL' | 'DIESEL'
    quantityLitres: number
    estimatedAmount: number
    creator: { name: string }
    branch: { branchName: string }
}

export default function FuelCouponsPage() {
    const router = useRouter()
    const [coupons, setCoupons] = useState<FuelCoupon[]>([])
    const [filteredCoupons, setFilteredCoupons] = useState<FuelCoupon[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCoupon, setSelectedCoupon] = useState<FuelCoupon | null>(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        fetchCoupons()
    }, [])

    useEffect(() => {
        filterCoupons()
    }, [coupons, activeTab, searchTerm])

    const fetchCoupons = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/fuel-coupons', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCoupons(data)
            }
        } catch (error) {
            console.error('Error fetching fuel coupons:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterCoupons = () => {
        let filtered = coupons

        if (activeTab !== 'ALL') {
            filtered = filtered.filter(c => c.fuelType === activeTab)
        }

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.documentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.plateNumber && c.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        }

        setFilteredCoupons(filtered)
    }

    const handleDownloadPDF = async (documentCode: string) => {
        try {
            const token = localStorage.getItem('token')
            // URL encode the document code to handle special characters like forward slashes
            const encodedCode = encodeURIComponent(documentCode)
            const res = await fetch(`/api/fuel-coupons/${encodedCode}?format=pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)

                // Download
                const a = document.createElement('a')
                a.href = url
                a.download = `${documentCode}.pdf`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)

                // Also open in new tab for printing
                window.open(url, '_blank')

                // Clean up
                setTimeout(() => window.URL.revokeObjectURL(url), 100)
            } else {
                const errorData = await res.json();
                console.error('Error downloading PDF:', errorData.error);
                alert(`Failed to download PDF: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error downloading PDF:', error)
            alert('Failed to download PDF')
        }
    }

    const handleDelete = async (documentCode: string) => {
        if (!confirm('Are you sure you want to delete this fuel coupon?')) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/fuel-coupons/${documentCode}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                fetchCoupons()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to delete')
            }
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const stats = {
        total: coupons.length,
        petrol: coupons.filter(c => c.fuelType === 'PETROL').length,
        diesel: coupons.filter(c => c.fuelType === 'DIESEL').length,
        totalQuantity: coupons.reduce((sum, c) => sum + Number(c.quantityLitres), 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)]"></div>
            </div>
        )
    }

    return (
        <div className="text-[color:var(--card-foreground)]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
                        <Fuel className="w-8 h-8 mr-3 text-[color:var(--primary)]" />
                        Fuel Coupons
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] text-sm mt-1">Manage fuel authorization coupons</p>
                </div>
                <button
                    onClick={() => router.push('/dashboard/fuel-coupons/create')}
                    className="flex items-center px-6 py-3 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg font-semibold shadow-lg hover:bg-[color:var(--primary)/.9] transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Coupon
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <p className="text-[color:var(--muted-foreground)] text-sm">Total Coupons</p>
                    <p className="text-3xl font-bold text-[color:var(--card-foreground)] mt-1">{stats.total}</p>
                </div>
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <p className="text-[color:var(--muted-foreground)] text-sm">Petrol</p>
                    <p className="text-3xl font-bold text-[color:var(--success)] mt-1">{stats.petrol}</p>
                </div>
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <p className="text-[color:var(--muted-foreground)] text-sm">Diesel</p>
                    <p className="text-3xl font-bold text-[color:var(--warning)] mt-1">{stats.diesel}</p>
                </div>
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <p className="text-[color:var(--muted-foreground)] text-sm">Total Litres</p>
                    <p className="text-2xl font-bold text-[color:var(--primary)] mt-1">{stats.totalQuantity.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                    {['ALL', 'PETROL', 'DIESEL'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-medium ${activeTab === tab ? 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)]' : 'bg-[color:var(--muted)/.2] text-[color:var(--card-foreground)] hover:bg-[color:var(--muted)/.3]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by staff, document code, or plate number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                    />
                </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] overflow-hidden">
                {filteredCoupons.length === 0 ? (
                    <div className="text-center py-12">
                        <Fuel className="w-16 h-16 text-[color:var(--muted-foreground)] mx-auto mb-4" />
                        <p className="text-[color:var(--muted-foreground)]">No fuel coupons found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[color:var(--muted)/.1] border-b border-[color:var(--border)]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase">Document Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase">Staff</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase">Fuel Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[color:var(--border)]">
                                {filteredCoupons.map((coupon) => (
                                    <tr
                                        key={coupon.documentCode}
                                        className="hover:bg-[color:var(--muted)/.1] cursor-pointer"
                                        onClick={() => { setSelectedCoupon(coupon); setShowModal(true); }}
                                    >
                                        <td className="px-6 py-4 font-medium text-[color:var(--card-foreground)]">{coupon.documentCode}</td>
                                        <td className="px-6 py-4 text-[color:var(--muted-foreground)]">{new Date(coupon.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-[color:var(--card-foreground)]">{coupon.staffName}</td>
                                        <td className="px-6 py-4 text-[color:var(--muted-foreground)]">{coupon.plateNumber || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                coupon.fuelType === 'PETROL'
                                                    ? 'bg-[color:var(--success)/.2] text-[color:var(--success)]'
                                                    : 'bg-[color:var(--warning)/.2] text-[color:var(--warning)]'
                                            }`}>
                                                {coupon.fuelType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-[color:var(--card-foreground)]">{coupon.quantityLitres} L</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(coupon.documentCode); }}
                                                    className="p-1 text-[color:var(--primary)] hover:bg-[color:var(--primary)/.1] rounded"
                                                    title="Download PDF"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(coupon.documentCode); }}
                                                    className="p-1 text-[color:var(--destructive)] hover:bg-[color:var(--destructive)/.1] rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedCoupon && (
                <div className="fixed inset-0 bg-[color:var(--background)] bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-[color:var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[color:var(--border)] text-[color:var(--card-foreground)]">
                        <div className="p-6 border-b border-[color:var(--border)] flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[color:var(--card-foreground)]">Fuel Coupon Preview</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[color:var(--muted)/.2] rounded-lg text-[color:var(--card-foreground)]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8">
                            {/* Coupon Preview */}
                            <div className="border-2 border-[color:var(--border)] p-6 rounded-lg bg-[color:var(--muted)/.1]">
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-bold text-[color:var(--card-foreground)]">FUEL AUTHORIZATION COUPON</h3>
                                    <p className="text-sm text-[color:var(--muted-foreground)]">Findules Financial Operations</p>
                                </div>
                                <div className="mb-4 pb-4 border-b border-[color:var(--border)]">
                                    <p className="font-semibold text-[color:var(--card-foreground)]">Document Code: {selectedCoupon.documentCode}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-semibold">Date:</span> {new Date(selectedCoupon.date).toLocaleDateString()}</div>
                                    <div><span className="font-semibold">Staff Name:</span> {selectedCoupon.staffName}</div>
                                    <div><span className="font-semibold">Department:</span> {selectedCoupon.department}</div>
                                    <div><span className="font-semibold">Branch:</span> {selectedCoupon.branch.branchName}</div>
                                    {selectedCoupon.vehicleType && <div><span className="font-semibold">Vehicle Type:</span> {selectedCoupon.vehicleType}</div>}
                                    {selectedCoupon.plateNumber && <div><span className="font-semibold">Plate Number:</span> {selectedCoupon.plateNumber}</div>}
                                    <div><span className="font-semibold">Fuel Type:</span> {selectedCoupon.fuelType}</div>
                                    <div><span className="font-semibold">Quantity:</span> {selectedCoupon.quantityLitres} Litres</div>
                                    <div className="col-span-2"><span className="font-semibold">Est. Amount:</span> ₦{Number(selectedCoupon.estimatedAmount).toLocaleString()}</div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-[color:var(--border)]">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="text-center">
                                            <p className="font-semibold">Assigned to:</p>
                                            <p className="text-[color:var(--muted-foreground)]">{selectedCoupon.staffName}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold">Authorized By:</p>
                                            <p className="text-[color:var(--muted-foreground)]">{selectedCoupon.creator.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-[color:var(--warning)/.1] border border-[color:var(--warning)/.3] rounded">
                                    <p className="text-xs font-semibold text-[color:var(--warning)]">NB: Fuel coupon must be used the same day.</p>
                                    <p className="text-xs text-[color:var(--warning)]">Coupons are only valid for the date issued.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[color:var(--border)] flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)/.2] text-[color:var(--card-foreground)]">
                                Close
                            </button>
                            <button onClick={() => handleDownloadPDF(selectedCoupon.documentCode)} className="flex items-center px-6 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg hover:bg-[color:var(--primary)/.9]">
                                <Printer className="w-4 h-4 mr-2" />
                                Print / Download
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
