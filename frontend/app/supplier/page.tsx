'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { BusinessIcon, EditIcon, TrashIcon, ImageIcon, ProfileIcon } from '@/components/icons/LokoloIcons'

interface BusinessStats {
  total_views: number
  total_contact_clicks: number
  total_favorites: number
}

export default function SupplierDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [businessStats, setBusinessStats] = useState<Record<string, BusinessStats>>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const token = await user?.getIdToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const businessList = data.data.businesses || []
          setBusinesses(businessList)
          
          // Fetch stats for each active business
          const statsPromises = businessList
            .filter((b: any) => b.status === 'active')
            .map(async (b: any) => {
              try {
                const statsRes = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/business/${b.id}/stats?days=30`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                )
                if (statsRes.ok) {
                  const statsData = await statsRes.json()
                  return { id: b.id, stats: statsData.data }
                }
              } catch (e) {
                console.error(`Failed to fetch stats for ${b.id}:`, e)
              }
              return { id: b.id, stats: { total_views: 0, total_contact_clicks: 0, total_favorites: 0 } }
            })
          
          const statsResults = await Promise.all(statsPromises)
          const statsMap: Record<string, BusinessStats> = {}
          statsResults.forEach((r) => {
            statsMap[r.id] = r.stats
          })
          setBusinessStats(statsMap)
        }
      } catch (error) {
        console.error('Failed to load businesses:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadBusinesses()
    }
  }, [user])

  // Calculate totals
  const totalViews = Object.values(businessStats).reduce((sum, s) => sum + (s?.total_views || 0), 0)
  const totalContacts = Object.values(businessStats).reduce((sum, s) => sum + (s?.total_contact_clicks || 0), 0)

  const handleDelete = async (businessId: string) => {
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete business')

      // Remove from list
      setBusinesses(prev => prev.filter(b => b.id !== businessId))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete business')
    }
  }

  const handleSubmitForApproval = async (businessId: string) => {
    if (!confirm('Submit this business for admin approval? You can still edit it while pending.')) {
      return
    }

    setActionLoading(businessId)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (!response.ok) throw new Error('Failed to submit')

      // Reload businesses to get updated status
      const reloadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      })
      if (reloadResponse.ok) {
        const data = await reloadResponse.json()
        setBusinesses(data.data.businesses || [])
      }
      
      alert('Business submitted for approval!')
    } catch (error) {
      console.error('Submit error:', error)
      alert('Failed to submit business')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your businesses...</p>
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
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white">Supplier Dashboard</h1>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <ProfileIcon size={24} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <BusinessIcon size={24} className="text-gold" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Businesses</p>
                <p className="text-2xl font-bold text-text-primary">{businesses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                <ImageIcon size={24} className="text-teal" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Active Listings</p>
                <p className="text-2xl font-bold text-text-primary">
                  {businesses.filter(b => b.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Views</p>
                <p className="text-2xl font-bold text-text-primary">{totalViews}</p>
                <p className="text-xs text-text-secondary">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📞</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Contact Clicks</p>
                <p className="text-2xl font-bold text-text-primary">{totalContacts}</p>
                <p className="text-xs text-text-secondary">Last 30 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Register New Business Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/supplier/register')}
            className="w-full md:w-auto px-6 py-4 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold transition-colors"
          >
            + Register New Business
          </button>
        </div>

        {/* Businesses List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Your Businesses</h2>

          {businesses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <BusinessIcon size={64} className="mx-auto mb-4 text-text-secondary" />
              <h3 className="text-xl font-bold text-text-primary mb-2">No businesses yet</h3>
              <p className="text-text-secondary mb-6">
                Get started by registering your first business
              </p>
              <button
                onClick={() => router.push('/supplier/register')}
                className="px-6 py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold transition-colors"
              >
                Register Your Business
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {businesses.map((business) => {
                const stats = businessStats[business.id]
                return (
                  <div
                    key={business.id}
                    className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Logo */}
                      <div className="w-20 h-20 bg-cream rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {business.logo_url ? (
                          <img
                            src={business.logo_url}
                            alt={business.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BusinessIcon size={32} className="text-text-secondary" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-text-primary truncate">
                              {business.name}
                            </h3>
                            {business.tagline && (
                              <p className="text-sm text-text-secondary truncate">
                                {business.tagline}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                              business.status === 'active'
                                ? 'bg-teal/10 text-teal'
                                : business.status === 'pending'
                                ? 'bg-gold/10 text-gold'
                                : business.status === 'draft'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-cream text-text-secondary'
                            }`}
                          >
                            {business.status}
                          </span>
                        </div>

                        {/* Analytics Stats for Active Businesses */}
                        {business.status === 'active' && stats && (
                          <div className="flex items-center gap-4 mb-3 text-sm bg-cream/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-1 text-text-secondary">
                              <span>👁️</span>
                              <span className="font-semibold text-text-primary">{stats.total_views}</span>
                              <span>views</span>
                            </div>
                            <div className="flex items-center gap-1 text-text-secondary">
                              <span>📞</span>
                              <span className="font-semibold text-text-primary">{stats.total_contact_clicks}</span>
                              <span>contacts</span>
                            </div>
                            <div className="flex items-center gap-1 text-text-secondary">
                              <span>❤️</span>
                              <span className="font-semibold text-text-primary">{stats.total_favorites}</span>
                              <span>favorites</span>
                            </div>
                          </div>
                        )}

                        {/* Verification Badge */}
                        {business.verification_status === 'approved' && (
                          <div className="flex items-center gap-1 text-teal text-sm mb-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Verified Owner</span>
                          </div>
                        )}

                        {/* Actions based on status */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {/* DRAFT: Show Submit for Approval */}
                          {business.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitForApproval(business.id)}
                              disabled={actionLoading === business.id}
                              className="px-4 py-2 bg-gold text-text-primary font-semibold rounded-lg text-sm hover:bg-[#E69515] disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === business.id ? '...' : '🚀 Submit for Approval'}
                            </button>
                          )}

                          {/* PENDING: Show awaiting label */}
                          {business.status === 'pending' && (
                            <span className="px-4 py-2 bg-gold/10 text-gold font-semibold rounded-lg text-sm">
                              ⏳ Awaiting Admin Approval
                            </span>
                          )}

                          {/* ACTIVE: Show View Public Page + Verify buttons */}
                          {business.status === 'active' && (
                            <>
                              <button
                                onClick={() => router.push(`/business/${business.id}`)}
                                className="px-4 py-2 bg-teal text-white font-semibold rounded-lg text-sm hover:bg-[#0E5A50] transition-colors"
                              >
                                👁️ View Public Page
                              </button>
                              {business.verification_status !== 'approved' && (
                                <button
                                  onClick={() => router.push(`/supplier/verification/${business.id}`)}
                                  className="px-4 py-2 bg-orange text-white font-semibold rounded-lg text-sm hover:bg-[#8F4814] transition-colors"
                                >
                                  🛡️ Verify Ownership
                                </button>
                              )}
                            </>
                          )}

                          {/* Always show Edit */}
                          <button
                            onClick={() => router.push(`/supplier/business/${business.id}/edit`)}
                            className="flex items-center gap-2 px-4 py-2 bg-cream text-text-primary font-semibold rounded-lg text-sm hover:bg-gray-200 transition-colors"
                          >
                            <EditIcon size={16} />
                            Edit
                          </button>

                          {/* Delete only for draft */}
                          {business.status === 'draft' && (
                            <button
                              onClick={() => handleDelete(business.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg text-sm hover:bg-red-100 transition-colors"
                            >
                              <TrashIcon size={16} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
