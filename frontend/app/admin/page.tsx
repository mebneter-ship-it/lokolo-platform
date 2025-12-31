'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface Stats {
  users: {
    total: number
    consumers: number
    suppliers: number
    admins: number
  }
  businesses: {
    total: number
    active: number
    draft: number
    suspended: number
    archived: number
  }
  verification: {
    pending: number
    approved: number
    rejected: number
  }
  engagement: {
    total_ratings: number
    total_favorites: number
  }
}

interface RecentBusiness {
  id: string
  name: string
  status: string
  verification_status: string
  created_at: string
  owner_name: string
  owner_email: string
}

interface RecentUser {
  id: string
  email: string
  display_name: string
  role: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBusinesses, setRecentBusinesses] = useState<RecentBusiness[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      checkAdminAccess()
    }
  }, [user, authLoading])

  const checkAdminAccess = async () => {
    try {
      const token = await user!.getIdToken()
      
      // Check if user is admin
      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (meResponse.ok) {
        const meData = await meResponse.json()
        setUserRole(meData.data?.role)
        
        if (meData.data?.role !== 'admin') {
          setError('Access denied. Admin privileges required.')
          setLoading(false)
          return
        }
      }
      
      // Fetch stats
      await fetchDashboardData(token)
    } catch (err) {
      console.error('Admin access check failed:', err)
      setError('Failed to verify admin access')
      setLoading(false)
    }
  }

  const fetchDashboardData = async (token: string) => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/activity?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentBusinesses(activityData.data.recent_businesses || [])
        setRecentUsers(activityData.data.recent_users || [])
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">{error || 'You need admin privileges to access this page.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <img src="/images/lokolo-logo.png" alt="Lokolo" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm">{user?.email}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        {/* Stats Grid */}
        {stats && stats.users && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Users */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-text-secondary text-sm">Total Users</span>
              </div>
              <p className="text-3xl font-bold text-text-primary">{stats.users?.total || 0}</p>
              <p className="text-xs text-text-secondary mt-1">
                {stats.users?.consumers || 0} consumers, {stats.users?.suppliers || 0} suppliers
              </p>
            </div>

            {/* Businesses */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-text-secondary text-sm">Total Businesses</span>
              </div>
              <p className="text-3xl font-bold text-text-primary">{stats.businesses?.total || 0}</p>
              <p className="text-xs text-text-secondary mt-1">
                {stats.businesses?.active || 0} active
              </p>
            </div>

            {/* Pending Verification */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-text-secondary text-sm">Pending Verification</span>
              </div>
              <p className="text-3xl font-bold text-orange">{stats.verification?.pending || 0}</p>
              <p className="text-xs text-text-secondary mt-1">
                {stats.verification?.approved || 0} verified
              </p>
            </div>

            {/* Engagement */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <span className="text-text-secondary text-sm">Engagement</span>
              </div>
              <p className="text-3xl font-bold text-text-primary">{stats.engagement?.total_favorites || 0}</p>
              <p className="text-xs text-text-secondary mt-1">
                favorites, {stats.engagement?.total_ratings || 0} ratings
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/admin/businesses" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Manage Businesses</h3>
                <p className="text-sm text-text-secondary">View, approve, suspend</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/users" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Manage Users</h3>
                <p className="text-sm text-text-secondary">View users, change roles</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/verification" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Verification Requests</h3>
                <p className="text-sm text-text-secondary">Review ownership docs</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/analytics" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Analytics</h3>
                <p className="text-sm text-text-secondary">Track engagement</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Businesses */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-text-primary mb-4">Recent Businesses</h3>
            {recentBusinesses.length === 0 ? (
              <p className="text-text-secondary text-sm">No recent businesses</p>
            ) : (
              <div className="space-y-3">
                {recentBusinesses.map((business) => (
                  <div key={business.id} className="flex items-center justify-between py-2 border-b border-cream last:border-0">
                    <div>
                      <p className="font-semibold text-text-primary">{business.name}</p>
                      <p className="text-xs text-text-secondary">{business.owner_name || business.owner_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        business.status === 'active' ? 'bg-green-100 text-green-700' :
                        business.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {business.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        business.verification_status === 'approved' ? 'bg-teal/10 text-teal' :
                        business.verification_status === 'pending' ? 'bg-orange/10 text-orange' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {business.verification_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/businesses" className="block mt-4 text-center text-sm text-orange font-semibold">
              View all businesses →
            </Link>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-text-primary mb-4">Recent Users</h3>
            {recentUsers.length === 0 ? (
              <p className="text-text-secondary text-sm">No recent users</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-cream last:border-0">
                    <div>
                      <p className="font-semibold text-text-primary">{user.display_name || 'No name'}</p>
                      <p className="text-xs text-text-secondary">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'supplier' ? 'bg-gold/10 text-gold' :
                      'bg-teal/10 text-teal'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/users" className="block mt-4 text-center text-sm text-orange font-semibold">
              View all users →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
