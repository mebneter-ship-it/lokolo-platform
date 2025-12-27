'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface Business {
  id: string
  name: string
  tagline: string
  status: string
  verification_status: string
  city: string
  created_at: string
  owner_id: string
}

export default function AdminBusinessesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [verificationFilter, setVerificationFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const updateVerificationStatus = async (businessId: string, verificationStatus: string) => {
    setActionLoading(businessId)
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/businesses/${businessId}/verification`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verification_status: verificationStatus }),
      })

      if (response.ok) {
        fetchBusinesses()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update verification')
      }
    } catch (err) {
      console.error('Failed to update verification status:', err)
      alert('Failed to update verification status')
    } finally {
      setActionLoading(null)
    }
  }

  const approveBusiness = async (businessId: string) => {
    setActionLoading(businessId)
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/businesses/${businessId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchBusinesses()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to approve business')
      }
    } catch (err) {
      console.error('Failed to approve business:', err)
      alert('Failed to approve business')
    } finally {
      setActionLoading(null)
    }
  }

  const rejectBusiness = async (businessId: string) => {
    const reason = prompt('Enter rejection reason (optional):')
    setActionLoading(businessId)
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/businesses/${businessId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        fetchBusinesses()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to reject business')
      }
    } catch (err) {
      console.error('Failed to reject business:', err)
      alert('Failed to reject business')
    } finally {
      setActionLoading(null)
    }
  }

  const updateBusinessStatus = async (businessId: string, newStatus: string) => {
    setActionLoading(businessId)
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/businesses/${businessId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchBusinesses()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update status')
      }
    } catch (err) {
      console.error('Failed to update business status:', err)
      alert('Failed to update business status')
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      checkAdminAccess()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (userRole === 'admin') {
      fetchBusinesses()
    }
  }, [userRole, statusFilter, verificationFilter, page])

  const checkAdminAccess = async () => {
    try {
      const token = await user!.getIdToken()
      const meResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (meResponse.ok) {
        const meData = await meResponse.json()
        setUserRole(meData.data?.role)
        
        if (meData.data?.role !== 'admin') {
          setError('Access denied. Admin privileges required.')
          setLoading(false)
        }
      }
    } catch (err) {
      console.error('Admin access check failed:', err)
      setError('Failed to verify admin access')
      setLoading(false)
    }
  }

  const fetchBusinesses = async () => {
    try {
      setLoading(true)
      const token = await user!.getIdToken()
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/businesses?page=${page}&limit=20`
      if (statusFilter) url += `&status=${statusFilter}`
      if (verificationFilter) url += `&verification_status=${verificationFilter}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.data.businesses || [])
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1)
        }
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBusinesses = businesses.filter(b => 
    !searchQuery || 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      suspended: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      draft: 'bg-gray-100 text-gray-700',
      archived: 'bg-gray-100 text-gray-700',
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  const getVerificationBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-teal/10 text-teal',
      pending: 'bg-orange/10 text-orange',
      rejected: 'bg-red-100 text-red-700',
    }
    return styles[status] || 'bg-gray-100 text-gray-700'
  }

  if (authLoading || (loading && !userRole)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold">
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
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/admin" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-white">Manage Businesses</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          {/* Search */}
          <div className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or city..."
              className="w-full px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-gold"
            />
          </div>
          
          {/* Filter row */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-gold text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">⏳ Pending Approval</option>
              <option value="active">✅ Active</option>
              <option value="draft">📝 Draft</option>
              <option value="suspended">🚫 Suspended</option>
              <option value="rejected">❌ Rejected</option>
            </select>
            
            <select
              value={verificationFilter}
              onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
              className="flex-1 px-3 py-2 border border-cream rounded-lg focus:outline-none focus:border-gold text-sm"
            >
              <option value="">All Verification</option>
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Verified</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
          
          <button
            onClick={fetchBusinesses}
            disabled={loading}
            className="w-full mt-3 px-4 py-2 bg-gold text-text-primary rounded-lg font-semibold hover:bg-[#E69515] disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Business Cards (Mobile-friendly) */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-text-secondary">
            No businesses found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBusinesses.map((business) => (
              <div key={business.id} className="bg-white rounded-xl shadow-sm p-4">
                {/* Business Info */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-primary truncate">{business.name}</h3>
                    <p className="text-sm text-text-secondary truncate">{business.tagline || '—'}</p>
                    <p className="text-xs text-text-secondary mt-1">{business.city} • {new Date(business.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link
                    href={`/business/${business.id}`}
                    target="_blank"
                    className="ml-2 px-3 py-1 text-sm text-teal hover:bg-teal/10 rounded-lg"
                  >
                    View
                  </Link>
                </div>
                
                {/* Status Badges */}
                <div className="flex gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(business.status)}`}>
                    {business.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationBadge(business.verification_status)}`}>
                    {business.verification_status === 'approved' ? '✓ Verified' : business.verification_status}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* APPROVAL ACTIONS - For pending businesses */}
                  {business.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveBusiness(business.id)}
                        disabled={actionLoading === business.id}
                        className="flex-1 min-w-[100px] px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 font-medium"
                      >
                        {actionLoading === business.id ? '...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => rejectBusiness(business.id)}
                        disabled={actionLoading === business.id}
                        className="flex-1 min-w-[100px] px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50 font-medium"
                      >
                        {actionLoading === business.id ? '...' : '✗ Reject'}
                      </button>
                    </>
                  )}
                  
                  {/* VERIFICATION ACTIONS - For active businesses with pending verification */}
                  {business.status === 'active' && business.verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateVerificationStatus(business.id, 'approved')}
                        disabled={actionLoading === business.id}
                        className="flex-1 min-w-[120px] px-3 py-2 text-sm text-teal border border-teal hover:bg-teal/10 rounded-lg disabled:opacity-50 font-medium"
                      >
                        {actionLoading === business.id ? '...' : '✓ Verify Ownership'}
                      </button>
                      <button
                        onClick={() => updateVerificationStatus(business.id, 'rejected')}
                        disabled={actionLoading === business.id}
                        className="flex-1 min-w-[120px] px-3 py-2 text-sm text-orange border border-orange hover:bg-orange/10 rounded-lg disabled:opacity-50 font-medium"
                      >
                        {actionLoading === business.id ? '...' : '✗ Reject Ownership'}
                      </button>
                    </>
                  )}
                  
                  {/* SUSPEND/ACTIVATE - For active or suspended businesses */}
                  {business.status === 'active' && (
                    <button
                      onClick={() => updateBusinessStatus(business.id, 'suspended')}
                      disabled={actionLoading === business.id}
                      className="px-3 py-2 text-sm text-red-600 border border-red-300 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading === business.id ? '...' : 'Suspend'}
                    </button>
                  )}
                  
                  {business.status === 'suspended' && (
                    <button
                      onClick={() => updateBusinessStatus(business.id, 'active')}
                      disabled={actionLoading === business.id}
                      className="px-3 py-2 text-sm text-green-600 border border-green-300 hover:bg-green-50 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading === business.id ? '...' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 bg-white rounded-xl p-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-text-secondary">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
