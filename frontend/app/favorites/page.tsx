'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import BusinessCard from '@/components/BusinessCard'

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

  const handleFavoriteToggle = async (businessId: string, isFavorite: boolean) => {
    // Since we're on favorites page, toggling means removing
    if (!isFavorite) {
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
      }
    }
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
        <div className="flex items-center gap-3 px-4 py-3">
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
          <div className="space-y-0">
            {favorites.map((business) => (
              <BusinessCard
                key={business.id}
                business={{
                  id: business.id,
                  name: business.name,
                  short_description: business.tagline,
                  tagline: business.tagline,
                  logo_url: business.logo_url,
                  rating: business.rating,
                  total_ratings: business.total_ratings,
                  verified: business.verification_status === 'approved',
                  isFavorite: true, // All items on this page are favorites
                }}
                onClick={() => router.push(`/business/${business.id}`)}
                onFavoriteToggle={handleFavoriteToggle}
              />
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
