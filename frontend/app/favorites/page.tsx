'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BusinessCard from '@/components/BusinessCard'

export default function FavoritesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login')
      return
    }

    loadFavorites()
  }, [user])

  const loadFavorites = async () => {
    if (!user) return

    try {
      setLoading(true)
      const token = await user.getIdToken()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const favoritesList = data.data?.favorites || []
        setFavorites(favoritesList)
        console.log(`✅ Loaded ${favoritesList.length} favorites`)
      } else {
        console.error('Failed to load favorites:', response.status)
        setFavorites([])
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteToggle = async (businessId: string, isFavorite: boolean) => {
    if (!user) return

    try {
      const token = await user.getIdToken()

      if (!isFavorite) {
        // Remove from favorites
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        })

        if (response.ok) {
          // Remove from local state
          setFavorites(prev => prev.filter((b: any) => b.id !== businessId))
          console.log('✅ Favorite removed')
        }
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
  }

  const handleCardClick = (businessId: string) => {
    router.push(`/business/${businessId}`)
  }

  const handleBackToDiscover = () => {
    router.push('/')
  }

  if (!user && !loading) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-cream text-text-primary hover:bg-gold transition-colors"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-2xl font-bold text-text-primary">My Favorites</h1>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading your favorites...</p>
            </div>
          </div>
        )}

        {!loading && favorites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💛</div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                No favorites yet
              </h2>
              <p className="text-text-secondary mb-8">
                Start discovering and save your favorite businesses here
              </p>
            </div>
            
            <button
              onClick={handleBackToDiscover}
              className="px-6 py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all"
            >
              Discover Businesses
            </button>
          </div>
        )}

        {!loading && favorites.length > 0 && (
          <>
            {/* Count */}
            <div className="mb-4">
              <p className="text-text-secondary">
                {favorites.length} {favorites.length === 1 ? 'business' : 'businesses'} saved
              </p>
            </div>

            {/* Favorites List */}
            <div className="space-y-0">
              {favorites.map((business: any) => (
                <BusinessCard
                  key={business.id}
                  business={{
                    ...business,
                    isFavorite: true // All are favorites on this page
                  }}
                  onClick={() => handleCardClick(business.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  isSelected={false}
                />
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-8 text-center">
              <button
                onClick={handleBackToDiscover}
                className="text-orange font-semibold hover:text-dark-orange"
              >
                Discover more businesses →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
