'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { BusinessIcon, EditIcon, TrashIcon, ImageIcon, ProfileIcon } from '@/components/icons/LokoloIcons'

export default function SupplierDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses`, {
          headers: {
            'Authorization': `Bearer ${await user?.getIdToken()}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBusinesses(data.data.businesses || [])
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
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange to-gold shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/lokolo-logo.png"
                alt="Lokolo"
                width={60}
                height={60}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Supplier Dashboard</h1>
                <p className="text-sm text-white/90">Manage your businesses</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="w-10 h-10 rounded-full bg-gold flex items-center justify-center hover:bg-[#E69515] active:scale-95 transition-all"
              aria-label="Profile"
            >
              <ProfileIcon size={24} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Views</p>
                <p className="text-2xl font-bold text-text-primary">-</p>
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
              {businesses.map((business) => (
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

                      <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                        <span>{business.category}</span>
                        <span>•</span>
                        <span>{business.city}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => router.push(`/supplier/businesses/${business.id}/edit`)}
                          className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold font-semibold rounded-xl hover:bg-gold hover:text-white transition-colors"
                        >
                          <EditIcon size={18} />
                          Edit
                        </button>
                        
                        {/* Show View Public Page only for active businesses */}
                        {business.status === 'active' && (
                          <button
                            onClick={() => router.push(`/business/${business.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-teal/10 text-teal font-semibold rounded-xl hover:bg-teal hover:text-white transition-colors"
                          >
                            👁️ View Public Page
                          </button>
                        )}
                        
                        {/* Submit for Approval - for draft businesses */}
                        {business.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitForApproval(business.id)}
                            disabled={actionLoading === business.id}
                            className="flex items-center gap-2 px-4 py-2 bg-teal text-white font-semibold rounded-xl hover:bg-teal/90 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === business.id ? '...' : '🚀 Submit for Approval'}
                          </button>
                        )}
                        
                        {/* Pending status indicator */}
                        {business.status === 'pending' && (
                          <span className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold font-semibold rounded-xl">
                            ⏳ Awaiting Admin Approval
                          </span>
                        )}
                        
                        {/* Verify Ownership - for active businesses */}
                        {business.status === 'active' && (
                          <button
                            onClick={() => router.push(`/supplier/verification/${business.id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange/10 text-orange font-semibold rounded-xl hover:bg-orange hover:text-white transition-colors"
                          >
                            🛡️ Verify Ownership
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(business.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <TrashIcon size={18} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
