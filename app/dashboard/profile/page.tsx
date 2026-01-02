'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    branchName: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setFormData({
        name: parsedUser.name,
        email: parsedUser.email,
        role: parsedUser.role,
        branchName: parsedUser.branchName
      })
    }
    setLoading(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Update local storage
        const updatedUser = { ...user, name: formData.name }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        setEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('An error occurred while updating profile')
    }
  }

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirmation do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }

    try {
      const token = localStorage.getItem('token')

      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Password changed successfully!')
        setChangingPassword(false)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        alert(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('An error occurred while changing password')
    }
  }

  const handlePasswordChangeCancel = () => {
    setChangingPassword(false)
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[color:var(--card-foreground)]">My Profile</h1>
      </div>

      <div className="bg-[color:var(--card)] border-[color:var(--border)] rounded-lg p-6">
        <h2 className="text-xl font-bold text-[color:var(--card-foreground)] mb-4">Personal Information</h2>
        <div className="space-y-4">
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="text-[color:var(--card-foreground)] block mb-1">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="bg-[color:var(--card)] border-[color:var(--border)] text-[color:var(--card-foreground)] w-full p-2 rounded border"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-[color:var(--card-foreground)] block mb-1">Email</label>
                  <input
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="bg-[color:var(--muted)] border-[color:var(--border)] text-[color:var(--muted-foreground)] w-full p-2 rounded border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className="text-[color:var(--card-foreground)] block mb-1">Role</label>
                  <input
                    id="role"
                    name="role"
                    value={formData.role}
                    readOnly
                    className="bg-[color:var(--muted)] border-[color:var(--border)] text-[color:var(--muted-foreground)] w-full p-2 rounded border"
                  />
                </div>
                <div>
                  <label htmlFor="branchName" className="text-[color:var(--card-foreground)] block mb-1">Branch</label>
                  <input
                    id="branchName"
                    name="branchName"
                    value={formData.branchName}
                    readOnly
                    className="bg-[color:var(--muted)] border-[color:var(--border)] text-[color:var(--muted-foreground)] w-full p-2 rounded border"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] px-4 py-2 rounded">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      role: user?.role || '',
                      branchName: user?.branchName || ''
                    })
                  }}
                  className="border-[color:var(--border)] text-[color:var(--card-foreground)] px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[color:var(--muted-foreground)] block mb-1">Full Name</label>
                  <p className="text-[color:var(--card-foreground)]">{user?.name}</p>
                </div>
                <div>
                  <label className="text-[color:var(--muted-foreground)] block mb-1">Email</label>
                  <p className="text-[color:var(--card-foreground)]">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[color:var(--muted-foreground)] block mb-1">Role</label>
                  <p className="text-[color:var(--card-foreground)]">{user?.role}</p>
                </div>
                <div>
                  <label className="text-[color:var(--muted-foreground)] block mb-1">Branch</label>
                  <p className="text-[color:var(--card-foreground)]">{user?.branchName}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] px-4 py-2 rounded"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setChangingPassword(true)}
                  className="border-[color:var(--border)] text-[color:var(--card-foreground)] px-4 py-2 rounded"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Password Change Form */}
        {changingPassword && (
          <div className="mt-6 bg-[color:var(--muted)] p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-[color:var(--card-foreground)] mb-1">Current Password</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="bg-[color:var(--card)] border-[color:var(--border)] text-[color:var(--card-foreground)] w-full p-2 rounded border"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-[color:var(--card-foreground)] mb-1">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="bg-[color:var(--card)] border-[color:var(--border)] text-[color:var(--card-foreground)] w-full p-2 rounded border"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-[color:var(--card-foreground)] mb-1">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="bg-[color:var(--card)] border-[color:var(--border)] text-[color:var(--card-foreground)] w-full p-2 rounded border"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] px-4 py-2 rounded">
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChangeCancel}
                  className="border-[color:var(--border)] text-[color:var(--card-foreground)] px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}