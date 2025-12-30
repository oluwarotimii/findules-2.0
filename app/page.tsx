'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Force full page reload to include cookie
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--background)] relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-[color:var(--card)] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-[color:var(--border)]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[color:var(--card-foreground)] mb-2">Findules</h1>
          <p className="text-[color:var(--muted-foreground)]">Financial Operations Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[color:var(--destructive)/.1] border border-[color:var(--destructive)] text-[color:var(--destructive)] px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent transition bg-[color:var(--card)] text-[color:var(--card-foreground)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent transition bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--navy)] hover:text-[color:var(--navy)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[color:var(--primary)] hover:bg-[color:var(--primary)] cursor-pointer text-[color:var(--primary-foreground)] font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[color:var(--muted-foreground)]">
          <p>Default credentials for testing:</p>
          <p className="font-mono text-xs mt-1">admin@findules.com / password</p>
        </div>
      </div>
    </div>
  )
}
