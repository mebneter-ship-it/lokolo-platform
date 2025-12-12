'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { HeartIcon, LocationIcon, BusinessIcon } from '@/components/icons/LokoloIcons'
import { updateProfile } from 'firebase/auth'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  
  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  
  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  // Fetch user role from API
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return
      
      try {
        const token = await user.getIdToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.data?.role || 'consumer')
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error)
        setUserRole('consumer') // Default fallback
      } finally {
        setRoleLoading(false)
      }
    }

    if (user) {
      fetchUserRole()
      setEditName(user.displayName || '')
    }
  }, [user])

  const handleEditSave = async () => {
    if (!user || !editName.trim()) return
    
    setSaving(true)
    setSaveError('')
    
    try {
      // Update Firebase profile
      await updateProfile(user, {
        displayName: editName.trim()
      })
      
      // Update backend
      const token = await user.getIdToken()
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: editName.trim(),
        }),
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return
    
    setDeleting(true)
    setDeleteError('')
    
    try {
      // Delete from backend first
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete account')
      }
      
      // Delete from Firebase
      await user.delete()
      
      // Redirect to home
      router.push('/')
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      if (error.code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign in again before deleting your account.')
      } else {
        setDeleteError('Failed to delete account. Please try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  if (loading || roleLoading || !user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isSupplier = userRole === 'supplier'

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-4">
          {/* Avatar and Edit Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center">
                <span className="text-4xl font-bold text-text-primary">
                  {user?.email?.[0].toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {user?.displayName || 'User'}
                </h2>
                <p className="text-text-secondary">{user?.email}</p>
              </div>
            </div>
            
            {/* Edit Button */}
            {!isEditing && (
              <button
                onClick={() => {
                  setEditName(user?.displayName || '')
                  setIsEditing(true)
                }}
                className="p-2 rounded-full bg-cream hover:bg-gold/20 transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <div className="border-t border-cream pt-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary mb-4"
                placeholder="Your name"
                style={{ fontSize: '16px' }}
              />
              
              {saveError && (
                <p className="text-red-500 text-sm mb-4">{saveError}</p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="flex-1 py-3 border-2 border-cream text-text-secondary font-semibold rounded-xl hover:bg-cream transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={saving || !editName.trim()}
                  className="flex-1 py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-[#E69515] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            /* Account Info */
            <div className="space-y-4 border-t border-cream pt-6">
              <div>
                <label className="text-sm font-semibold text-text-secondary">Email</label>
                <p className="text-text-primary">{user?.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-text-secondary">Account Type</label>
                <p className="text-text-primary capitalize">{userRole || 'Consumer'}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-text-secondary">Member Since</label>
                <p className="text-text-primary">
                  {user?.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Different for Consumer vs Supplier */}
        <div className="space-y-3">
          {isSupplier ? (
            <>
              {/* Supplier Actions */}
              <button
                onClick={() => router.push('/supplier/dashboard')}
                className="w-full p-4 bg-white rounded-xl shadow-sm text-left flex items-center justify-between hover:bg-cream transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BusinessIcon size={28} />
                  <span className="font-semibold text-text-primary">My Businesses</span>
                </div>
                <span className="text-text-secondary">→</span>
              </button>

              <button
                onClick={() => router.push('/supplier/register')}
                className="w-full p-4 bg-white rounded-xl shadow-sm text-left flex items-center justify-between hover:bg-cream transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-semibold text-text-primary">Register New Business</span>
                </div>
                <span className="text-text-secondary">→</span>
              </button>
            </>
          ) : (
            <>
              {/* Consumer Actions */}
              <button
                onClick={() => router.push('/favorites')}
                className="w-full p-4 bg-white rounded-xl shadow-sm text-left flex items-center justify-between hover:bg-cream transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HeartIcon size={28} filled />
                  <span className="font-semibold text-text-primary">My Favorites</span>
                </div>
                <span className="text-text-secondary">→</span>
              </button>

              <button
                onClick={() => router.push('/')}
                className="w-full p-4 bg-white rounded-xl shadow-sm text-left flex items-center justify-between hover:bg-cream transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LocationIcon size={28} />
                  <span className="font-semibold text-text-primary">Discover Businesses</span>
                </div>
                <span className="text-text-secondary">→</span>
              </button>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-6 py-4 bg-orange text-white font-bold rounded-xl shadow-md hover:bg-orange/90 active:scale-98 transition-all"
        >
          Sign Out
        </button>

        {/* Delete Account Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full mt-3 py-4 bg-white border-2 border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors"
        >
          Delete Account
        </button>

        {/* Version Info */}
        <div className="text-center mt-8">
          <p className="text-xs text-text-secondary">
            Lokolo Platform v1.0
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Account</h3>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-800 text-sm font-medium mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-red-700 text-sm">
                {isSupplier 
                  ? 'All your businesses, business photos, business hours, and account data will be permanently deleted.'
                  : 'All your favorites, ratings, and account data will be permanently deleted.'
                }
              </p>
            </div>
            
            <p className="text-text-secondary text-sm mb-4">
              To confirm, type <span className="font-bold text-text-primary">DELETE</span> below:
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-red-500 focus:outline-none text-text-primary mb-4"
              style={{ fontSize: '16px' }}
            />
            
            {deleteError && (
              <p className="text-red-500 text-sm mb-4">{deleteError}</p>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setDeleteError('')
                }}
                disabled={deleting}
                className="flex-1 py-3 border-2 border-cream text-text-secondary font-semibold rounded-xl hover:bg-cream transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
