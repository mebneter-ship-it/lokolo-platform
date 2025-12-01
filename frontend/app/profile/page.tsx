'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { HeartIcon, LocationIcon, BusinessIcon } from '@/components/icons/LokoloIcons'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

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
    }
  }, [user])

  // Redirect to login if not authenticated
  if (!loading && !user) {
    router.push('/login')
    return null
  }

  if (loading || roleLoading) {
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
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
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

          {/* Account Info */}
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

        {/* Version Info */}
        <div className="text-center mt-8">
          <p className="text-xs text-text-secondary">
            Lokolo Platform v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
