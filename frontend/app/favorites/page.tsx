'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BusinessCard from '@/components/BusinessCard'

interface Business {
  id: string
  name: string
  short_description?: string
  category?: string
  distance?: number
  is_verified?: boolean
  is_featured?: boolean
  logo_url?: string
  isFavorite?: boolean
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      
      // TODO: Replace with real API call when authentication is ready
      // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites`, {
      //   headers: {
      //     'Authorization': `Bearer ${idToken}`,
      //   },
      // })
      // const data = await response.json()
      // setFavorites(data.favorites)
      
      // For now, get from localStorage
      const savedFavorites = localStorage.getItem('lokolo_favorites')
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites)
        
        // Fetch business details for each favorite using API service
        const businessPromises = favoriteIds.map(async (id: string) => {
          try {
            // Use apiService to get proper data transformation
            const business = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${id}`)
              .then(res => res.json())
              .then(result => {
                // Transform the business data (category inference, etc.)
                const b = result.data
                return {
                  id: b.id,
                  name: b.name,
                  category: inferCategory(b.tagline || b.description || ''),
                  short_description: b.tagline || b.description?.substring(0, 100),
                  is_verified: b.verification_status === 'approved',
                  is_featured: b.metadata?.featured === true,
                  logo_url: b.logo_url,
                  distance: b.distance_km,
                  isFavorite: true
                }
              })
            return business
          } catch (error) {
            console.error(`Failed to fetch business ${id}:`, error)
            return null
          }
        })
        
        const businesses = await Promise.all(businessPromises)
        setFavorites(businesses.filter(b => b !== null))
      } else {
        setFavorites([])
      }
      
      // Helper function for category inference
      function inferCategory(text: string): string {
        const lower = text.toLowerCase()
        if (lower.includes('coffee') || lower.includes('café')) return 'Coffee'
        if (lower.includes('bakery') || lower.includes('bread')) return 'Bakery'
        if (lower.includes('kitchen') || lower.includes('cuisine') || lower.includes('food')) return 'Restaurant'
        if (lower.includes('hair') || lower.includes('beauty') || lower.includes('salon')) return 'Beauty'
        if (lower.includes('fashion') || lower.includes('clothing')) return 'Fashion'
        if (lower.includes('tech')) return 'Technology'
        return 'Other'
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteToggle = async (businessId: string, isFavorite: boolean) => {
    if (!isFavorite) {
      // Remove from favorites
      setFavorites(prev => prev.filter(b => b.id !== businessId))
      
      // Update localStorage
      const savedFavorites = localStorage.getItem('lokolo_favorites')
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites)
        const updated = favoriteIds.filter((id: string) => id !== businessId)
        localStorage.setItem('lokolo_favorites', JSON.stringify(updated))
      }
      
      // TODO: Call API when authentication is ready
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${idToken}` },
      // })
    }
  }

  const handleCardClick = (businessId: string) => {
    router.push(`/business/${businessId}`)
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-cream text-text-primary hover:bg-gold transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-2xl font-bold text-text-primary">My Favorites</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading your favorites...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && favorites.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center max-w-sm">
              <div className="text-6xl mb-4">❤️</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">No favorites yet</h2>
              <p className="text-text-secondary mb-6">
                Start exploring and tap the heart icon on businesses you love to save them here.
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold shadow-md hover:bg-[#FDB750] transition-colors"
              >
                Discover Businesses
              </button>
            </div>
          </div>
        )}

        {/* Favorites List */}
        {!loading && favorites.length > 0 && (
          <div>
            <p className="text-text-secondary mb-4">
              {favorites.length} {favorites.length === 1 ? 'business' : 'businesses'} saved
            </p>
            
            <div className="space-y-0">
              {favorites.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onClick={() => handleCardClick(business.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
