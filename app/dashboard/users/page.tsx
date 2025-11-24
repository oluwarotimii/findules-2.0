'use client'

import { useState, useEffect } from 'react'
import { UserCog, Plus, Edit, Trash2, Search } from 'lucide-react'

interface User {
    id: string
    name: string
    email: string
    role: 'STAFF' | 'MANAGER'
    branchId: string
    branch: { branchName: string }
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        const filtered = users.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredUsers(filtered)
        setCurrentPage(1)
    }, [users, searchTerm])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                        <UserCog className="w-8 h-8 mr-3 text-blue-600" />
                        User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage users and roles</p>
                </div>
                <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:bg-blue-700">
                    <Plus className="w-5 h-5 mr-2" />
                    New User
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Table - Mobile Responsive */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{user.branch.branchName}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                    {paginatedUsers.map((user) => (
                        <div key={user.id} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{user.branch.branchName}</p>
                            <div className="flex gap-2">
                                <button className="flex-1 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                                    <Edit className="w-4 h-4 inline mr-1" /> Edit
                                </button>
                                <button className="flex-1 px-3 py-2 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 inline mr-1" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 md:px-6 py-4 border-t flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
