import { Settings, Building } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
                <p className="text-gray-500">Configure system preferences and manage organization settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Branch Management Card */}
                <Link href="/dashboard/branches" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg mr-4">
                            <Building className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Branch Management</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Create and manage branches for your organization. Each branch can have its own cashiers and reconciliations.
                    </p>
                    <button className="text-blue-600 font-medium text-sm hover:text-blue-800 flex items-center">
                        Manage Branches
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </Link>

                {/* More settings cards can be added here */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-gray-100 rounded-lg mr-4">
                            <Settings className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-500">User Management</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                        Coming soon: Manage user accounts, roles, and permissions for your organization.
                    </p>
                    <button className="text-gray-400 font-medium text-sm cursor-not-allowed" disabled>
                        Manage Users
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-60">
                    <div className="flex items-center mb-4">
                        <div className="p-3 bg-gray-100 rounded-lg mr-4">
                            <Settings className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-500">System Preferences</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                        Coming soon: Configure system-wide preferences and settings.
                    </p>
                    <button className="text-gray-400 font-medium text-sm cursor-not-allowed" disabled>
                        Configure Settings
                    </button>
                </div>
            </div>
        </div>
    )
}
