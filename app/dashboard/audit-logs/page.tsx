'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, Archive } from 'lucide-react'

interface AuditLog {
    id: number
    timestamp: string
    userId: string
    user: { name: string }
    action: string
    module: string | null
    details: any
    ipAddress: string | null
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchLogs()
    }, [])

    useEffect(() => {
        filterLogs()
    }, [logs, activeTab, searchTerm])

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/audit-logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setLogs(data)
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterLogs = () => {
        let filtered = logs

        // Filter by module tab
        if (activeTab !== 'ALL') {
            filtered = filtered.filter(log => log.module === activeTab)
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(log =>
                (log.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.module || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredLogs(filtered)
    }

    // Format action for display
    const formatAction = (action: string) => {
        return action
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ')
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
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
                        <Archive className="w-8 h-8 mr-3 text-[color:var(--primary)]" />
                        Audit Logs
                    </h1>
                    <p className="text-[color:var(--muted-foreground)] text-sm mt-1">Track all user activities and system events</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Total Events</p>
                            <p className="text-3xl font-bold text-[color:var(--primary)] mt-1">{logs.length}</p>
                        </div>
                        <div className="p-3 bg-[color:var(--primary)/.2] rounded-lg">
                            <Archive className="w-6 h-6 text-[color:var(--primary)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Today's Events</p>
                            <p className="text-3xl font-bold text-[color:var(--success)] mt-1">
                                {logs.filter(log => 
                                    new Date(log.timestamp).toDateString() === new Date().toDateString()
                                ).length}
                            </p>
                        </div>
                        <div className="p-3 bg-[color:var(--success)/.2] rounded-lg">
                            <Calendar className="w-6 h-6 text-[color:var(--success)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Active Users</p>
                            <p className="text-3xl font-bold text-[color:var(--secondary)] mt-1">
                                {[...new Set(logs.map(log => log.userId))].length}
                            </p>
                        </div>
                        <div className="p-3 bg-[color:var(--secondary)/.2] rounded-lg">
                            <User className="w-6 h-6 text-[color:var(--secondary)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[color:var(--muted-foreground)] text-sm">Modules Tracked</p>
                            <p className="text-3xl font-bold text-[color:var(--accent)] mt-1">
                                {[...new Set(logs.map(log => log.module).filter(Boolean))].length}
                            </p>
                        </div>
                        <div className="p-3 bg-[color:var(--accent)/.2] rounded-lg">
                            <Filter className="w-6 h-6 text-[color:var(--accent)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] mb-6">
                {/* Module Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {['ALL', 'RECONCILIATION', 'FUEL_COUPON', 'IMPREST', 'CASH_REQUISITION'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab
                                ? 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)]'
                                : 'bg-[color:var(--muted)/.2] text-[color:var(--card-foreground)] hover:bg-[color:var(--muted)/.3]'
                                }`}
                        >
                            {tab === 'ALL' ? 'All Modules' : tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by user, action, or module..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                        <Archive className="w-16 h-16 text-[color:var(--muted-foreground)] mx-auto mb-4" />
                        <p className="text-[color:var(--muted-foreground)]">No audit logs found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[color:var(--muted)/.1] border-b border-[color:var(--border)]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Module
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                                        Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[color:var(--border)]">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[color:var(--muted)/.1]">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-[color:var(--primary)] rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-[color:var(--primary-foreground)]">
                                                        {log.user.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-[color:var(--card-foreground)]">{log.user.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium bg-[color:var(--primary)/.2] text-[color:var(--primary)] rounded-full">
                                                {formatAction(log.action)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--muted-foreground)]">
                                            {log.module || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--muted-foreground)]">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}