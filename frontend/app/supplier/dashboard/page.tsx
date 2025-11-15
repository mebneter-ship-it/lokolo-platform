'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export default function SupplierDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadBusiness()
  }, [user])

  const loadBusiness = async () => {
    if (!user) return

    try {
      const token = await user.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/my-business`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setBusiness(data.data || data.business)
      } else {
        // No business registered yet
        setBusiness(null)
      }
    } catch (error) {
      console.error('Failed to load business:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Image
              src="/images/lokolo-logo.png"
              alt="Lokolo"
              width={60}
              height={60}
              className="w-15 h-15"
            />
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Supplier Dashboard</h1>
              <p className="text-sm text-text-secondary">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-cream text-text-primary font-semibold rounded-xl hover:bg-gold transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading your business...</p>
            </div>
          </div>
        ) : business ? (
          // Has business registered
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-text-primary mb-2">{business.name}</h2>
                  <p className="text-text-secondary">{business.tagline}</p>
                </div>
                {business.verified && (
                  <span className="bg-teal text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-cream rounded-xl p-4">
                  <p className="text-text-secondary text-sm mb-1">Status</p>
                  <p className="text-xl font-bold text-text-primary capitalize">{business.status}</p>
                </div>
                <div className="bg-cream rounded-xl p-4">
                  <p className="text-text-secondary text-sm mb-1">Views</p>
                  <p className="text-xl font-bold text-text-primary">0</p>
                </div>
                <div className="bg-cream rounded-xl p-4">
                  <p className="text-text-secondary text-sm mb-1">Favorites</p>
                  <p className="text-xl font-bold text-text-primary">0</p>
                </div>
              </div>

              <button
                onClick={() => router.push(`/business/${business.id}`)}
                className="w-full py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold transition-colors"
              >
                View Public Page
              </button>
            </div>

            {/* Coming Soon */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <h3 className="text-xl font-bold text-text-primary mb-4">🚧 More Features Coming Soon</h3>
              <p className="text-text-secondary mb-4">
                We're building tools to help you manage your business:
              </p>
              <ul className="text-left text-text-secondary space-y-2 max-w-md mx-auto">
                <li>✓ Edit business details</li>
                <li>✓ Manage photos</li>
                <li>✓ Update business hours</li>
                <li>✓ View analytics & insights</li>
                <li>✓ Respond to customer messages</li>
              </ul>
            </div>
          </div>
        ) : (
          // No business registered
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Welcome to Lokolo Supplier Dashboard!
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              You haven't registered your business yet. Let's get started and make your business visible to thousands of customers!
            </p>
            <button
              onClick={() => router.push('/supplier/register')}
              className="px-8 py-4 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all"
            >
              Register Your Business
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
