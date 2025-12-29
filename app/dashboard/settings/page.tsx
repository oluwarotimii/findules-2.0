import { Settings, Building } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[color:var(--card-foreground)]">System Settings</h1>
                <p className="text-[color:var(--muted-foreground)]">Configure system preferences and manage organization settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Branch Management Card */}
                <Link href="/dashboard/branches" className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-[color:var(--primary)/.1] rounded-lg mr-4">
                            <Building className="w-6 h-6 text-[color:var(--primary)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[color:var(--card-foreground)]">Branch Management</h3>
                    </div>
                    <p className="text-[color:var(--card-foreground)] text-sm mb-4">
                        Create and manage branches for your organization. Each branch can have its own cashiers and reconciliations.
                    </p>
                    <button className="text-[color:var(--primary)] font-medium text-sm hover:text-[color:var(--primary)/.8] flex items-center">
                        Manage Branches
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </Link>

                {/* More settings cards can be added here */}
                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-[color:var(--muted)/.1] rounded-lg mr-4">
                            <Settings className="w-6 h-6 text-[color:var(--muted)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[color:var(--muted-foreground)]">User Management</h3>
                    </div>
                    <p className="text-[color:var(--muted-foreground)] text-sm mb-4">
                        Coming soon: Manage user accounts, roles, and permissions for your organization.
                    </p>
                    <button className="text-[color:var(--muted)] font-medium text-sm cursor-not-allowed" disabled>
                        Manage Users
                    </button>
                </div>

                <div className="bg-[color:var(--card)] p-6 rounded-xl shadow-sm border border-[color:var(--border)] opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-[color:var(--muted)/.1] rounded-lg mr-4">
                            <Settings className="w-6 h-6 text-[color:var(--muted)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[color:var(--muted-foreground)]">System Preferences</h3>
                    </div>
                    <p className="text-[color:var(--muted-foreground)] text-sm mb-4">
                        Coming soon: Configure system-wide preferences and settings.
                    </p>
                    <button className="text-[color:var(--muted)] font-medium text-sm cursor-not-allowed" disabled>
                        Configure Settings
                    </button>
                </div>
            </div>
        </div>
    )
}
