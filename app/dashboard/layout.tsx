'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Banknote,
    ClipboardCheck,
    Fuel,
    Wallet,
    BarChart3,
    Users,
    UserCog,
    Settings,
    LogOut,
    Menu,
    X,
    Building,
    PieChart
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface User {
    id: string
    name: string
    email: string
    role: string
    branchId: string
    branchName: string
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)

    useEffect(() => {
        // Get user from localStorage
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')

        if (!token || !userData) {
            router.push('/')
            return
        }

        setUser(JSON.parse(userData))
        setLoading(false)
    }, [router])

    const handleLogout = async () => {
        const token = localStorage.getItem('token')

        // Call logout API
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })

        // Clear localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // Redirect to login
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary)] mx-auto"></div>
                    <p className="mt-4 text-[color:var(--muted-foreground)]">Loading...</p>
                </div>
            </div>
        )
    }

    const isManager = user?.role === 'MANAGER'
    const isBranchAdmin = user?.role === 'BRANCH_ADMIN'
    const isStaff = user?.role === 'STAFF'

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['MANAGER'] },
        // { name: 'Cash Requisitions', href: '/dashboard/requisitions', icon: Banknote, roles: ['STAFF', 'MANAGER'] },
        { name: 'Reconciliations', href: '/dashboard/reconciliations', icon: ClipboardCheck, roles: ['MANAGER'] },
        { name: 'Fuel Coupons', href: '/dashboard/fuel-coupons', icon: Fuel, roles: ['MANAGER'] },
        { name: 'Imprest', href: '/dashboard/imprest', icon: Wallet, roles: ['STAFF', 'MANAGER', 'BRANCH_ADMIN'] },
        { name: 'Cashiers', href: '/dashboard/cashiers', icon: Users, roles: ['MANAGER'] },
        { name: 'Branches', href: '/dashboard/branches', icon: Building, roles: ['MANAGER'] },
        { name: 'Analytics', href: '/dashboard/analytics', icon: PieChart, roles: ['MANAGER', 'BRANCH_ADMIN', 'STAFF'] },
        { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: BarChart3, roles: ['MANAGER'] },
        { name: 'Users', href: '/dashboard/users', icon: UserCog, roles: ['MANAGER'] },
        // { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['MANAGER'] },
    ]

    const filteredNavigation = navigation.filter(item =>
        item.roles.includes(user?.role || '')
    );

    // Add profile page for all users
    const allUsersNavigation = [
        { name: 'Profile', href: '/dashboard/profile', icon: UserCog, roles: ['STAFF', 'BRANCH_ADMIN', 'MANAGER'] }
    ];

    const profileNavigation = allUsersNavigation.filter(item =>
        item.roles.includes(user?.role || '')
    );

    // Combine navigation items
    const combinedNavigation = [...filteredNavigation, ...profileNavigation];

    return (
        <div className="min-h-screen bg-[color:var(--background)]">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } bg-[color:var(--primary)] w-64`}
            >
                <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
                    {/* Logo */}
                    <div className="mb-8 px-3 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-[color:var(--primary-foreground)]">Findules</h1>
                            <p className="text-[color:var(--primary-foreground)] text-sm mt-1">Financial Operations</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)/.8] p-1 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="mb-6 px-3 py-3 bg-[color:var(--primary)/.8] rounded-lg">
                        <p className="text-[color:var(--primary-foreground)] font-semibold truncate">{user?.name}</p>
                        {/* <p className="text-[color:var(--primary-foreground)] text-sm truncate">{user?.email}</p> */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-[color:var(--primary-foreground)] text-[color:var(--primary-foreground)/.9] text-xs rounded">
                                {user?.role}
                            </span>
                            <span className="px-2 py-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-xs rounded">
                                {user?.branchName}
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 flex-1">
                        {combinedNavigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center px-3 py-2.5 text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary)] col rounded-lg transition-colors group"
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Logout Button */}
                    <div className="mt-auto pt-4">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2.5 text-[color:var(--primary-foreground)] bg-[color:var(--destructive)] hover:bg-[color:var(--destructive)/.9] rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
                {/* Top Bar */}
                <header className="bg-[color:var(--card)] shadow-sm sticky top-0 z-30 border-b border-[color:var(--border)]">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-[color:var(--muted)/.1] transition-colors text-[color:var(--card-foreground)]"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                            <div className="text-right">
                                <p className="text-sm text-[color:var(--card-foreground)]">
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 bg-[color:var(--background)] min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>
        </div>
    )
}
