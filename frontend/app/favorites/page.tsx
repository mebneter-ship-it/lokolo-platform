'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface FavoriteBusiness {
  id: string
  name: string
  tagline?: string
  description?: string
  city?: string
  verification_status?: string
  logo_url?: string
  rating: number
  total_ratings: number
  favorited_at: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchFavorites()
    }
  }, [user, authLoading])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setFavorites(data.data.favorites || [])
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (businessId: string) => {
    setRemovingId(businessId)
    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(f => f.id !== businessId))
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    } finally {
      setRemovingId(null)
    }
  }

  // Get category-based gradient for businesses without logos
  const getCategoryGradient = (business: FavoriteBusiness) => {
    const searchText = `${business.name || ''} ${business.tagline || ''} ${business.description || ''}`.toLowerCase()
    
    if (searchText.includes('coffee') || searchText.includes('food') || searchText.includes('restaurant') || searchText.includes('kitchen') || searchText.includes('cuisine') || searchText.includes('bakery')) {
      return 'linear-gradient(135deg, #F5A623 0%, #FDB750 100%)'
    } else if (searchText.includes('fashion') || searchText.includes('retail') || searchText.includes('clothing')) {
      return 'linear-gradient(135deg, #B85C1A 0%, #D67B2C 100%)'
    } else {
      return 'linear-gradient(135deg, #156B60 0%, #1A8173 100%)'
    }
  }

  // Get category emoji
  const getCategoryEmoji = (business: FavoriteBusiness) => {
    const searchText = `${business.name || ''} ${business.tagline || ''} ${business.description || ''}`.toLowerCase()
    
    if (searchText.includes('coffee')) return '☕'
    if (searchText.includes('bakery') || searchText.includes('bread')) return '🥐'
    if (searchText.includes('food') || searchText.includes('restaurant') || searchText.includes('kitchen') || searchText.includes('cuisine')) return '🍽️'
    if (searchText.includes('fashion') || searchText.includes('clothing')) return '👗'
    if (searchText.includes('beauty') || searchText.includes('salon')) return '💅'
    if (searchText.includes('tech')) return '💻'
    if (searchText.includes('bar') || searchText.includes('pub')) return '🍺'
    if (searchText.includes('gym') || searchText.includes('fitness')) return '💪'
    if (searchText.includes('book')) return '📚'
    return '🏪'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

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
           <img src="/images/lokolo-logo.png" alt="Lokolo" className="w-10 h-10 rounded-lg" />
          <h1 className="text-xl font-bold text-white">My Favorites</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-text-secondary mb-4">{favorites.length} businesses saved</p>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❤️</span>
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">No favorites yet</h2>
            <p className="text-text-secondary mb-6">Start exploring and save businesses you love!</p>
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-gold text-text-primary font-semibold rounded-xl hover:bg-light-gold transition-colors"
            >
              Discover businesses →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((business) => (
              <div 
                key={business.id} 
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <Link href={`/business/${business.id}`} className="block">
                  <div className="flex p-4">
                    {/* Logo/Image */}
                    <div
                      className="flex-shrink-0 w-20 h-20 rounded-lg flex items-center justify-center text-2xl overflow-hidden"
                      style={{
                        background: business.logo_url ? 'transparent' : getCategoryGradient(business),
                      }}
                    >
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `<span class="text-2xl">${getCategoryEmoji(business)}</span>`
                            target.parentElement!.style.background = getCategoryGradient(business)
                          }}
                        />
                      ) : (
                        <span>{getCategoryEmoji(business)}</span>
                      )}
                    </div>

                    {/* Business Info */}
                    <div className="flex-1 ml-4 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-text-primary truncate">{business.name}</h3>
                            {business.verification_status === 'approved' && (
                              <span 
                                className="flex-shrink-0 w-5 h-5 bg-teal rounded-full flex items-center justify-center"
                                title="Verified Black-Owned"
                              >
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-gold">⭐</span>
                            <span className="text-sm font-medium text-text-primary">
                              {business.rating > 0 ? business.rating.toFixed(1) : '—'}
                            </span>
                            {business.total_ratings > 0 && (
                              <span className="text-sm text-text-secondary">
                                ({business.total_ratings})
                              </span>
                            )}
                          </div>
                          
                          {/* Tagline */}
                          {business.tagline && (
                            <p className="text-sm text-text-secondary mt-1 flex items-center gap-1">
                              {getCategoryEmoji(business)} {business.tagline}
                            </p>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemoveFavorite(business.id)
                          }}
                          disabled={removingId === business.id}
                          className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                          aria-label="Remove from favorites"
                        >
                          {removingId === business.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="text-xl">❤️</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Discover More Link */}
        {favorites.length > 0 && (
          <div className="text-center mt-6">
            <Link 
              href="/"
              className="text-orange hover:text-gold transition-colors font-medium"
            >
              Discover more businesses →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
