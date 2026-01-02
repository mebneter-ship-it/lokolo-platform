'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TopNavigation from '@/components/TopNavigation'
import MapView from '@/components/MapView'
import BusinessCard from '@/components/BusinessCard'
import { apiService } from '@/lib/api/businesses'
import { useAuth } from '@/hooks/useAuth'

interface FilterState {
  verified_only?: boolean
  open_now?: boolean
  featured_only?: boolean
}

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [radius, setRadius] = useState(10) // Default 10km

  // Load favorites from backend when user logs in
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        console.log('🔵 Loading favorites for logged-in user')
        try {
          const token = await user.getIdToken()
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('✅ Backend response:', data)
            
            // Backend returns {success: true, data: {favorites: [...], pagination: {...}}}
            const favoritesList = data.data?.favorites || []
            console.log('✅ Favorites list:', favoritesList)
            
            const favoriteIds = favoritesList.map((b: any) => b.id)
            setFavorites(new Set(favoriteIds))
            localStorage.setItem('lokolo_favorites', JSON.stringify(favoriteIds))
            console.log(`✅ Loaded ${favoriteIds.length} favorites from backend`)
          } else {
            console.log('⚠️ Backend returned:', response.status, response.statusText)
            // Fall back to localStorage
            const savedFavorites = localStorage.getItem('lokolo_favorites')
            if (savedFavorites) {
              const ids = JSON.parse(savedFavorites)
              setFavorites(new Set(ids))
              console.log(`📦 Loaded ${ids.length} favorites from localStorage`)
            }
          }
        } catch (error) {
          console.error('❌ Failed to load favorites from backend:', error)
          // Fall back to localStorage
          const savedFavorites = localStorage.getItem('lokolo_favorites')
          if (savedFavorites) {
            const ids = JSON.parse(savedFavorites)
            setFavorites(new Set(ids))
            console.log(`📦 Loaded ${ids.length} favorites from localStorage (fallback)`)
          }
        }
      } else {
        // Not logged in - use localStorage only
        console.log('🔵 Not logged in, using localStorage')
        const savedFavorites = localStorage.getItem('lokolo_favorites')
        if (savedFavorites) {
          const ids = JSON.parse(savedFavorites)
          setFavorites(new Set(ids))
          console.log(`📦 Loaded ${ids.length} favorites from localStorage`)
        }
      }
    }
    
    loadFavorites()
  }, [user])

  // Get user's REAL location on mount
  useEffect(() => {
    const getUserLocation = () => {
      if ('geolocation' in navigator) {
        console.log('Requesting user location...')
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setUserLocation(location)
            console.log('Got user location:', location)
          },
          (error) => {
            console.error('Location error:', error.message)
            // Fallback to Switzerland (Emmen, Lucerne) if permission denied or error
            console.log('Using Switzerland as fallback')
            setUserLocation({ lat: 47.0784, lng: 8.2847 })
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // Cache for 5 minutes
          }
        )
      } else {
        console.log('Geolocation not supported, using Switzerland')
        setUserLocation({ lat: 47.0784, lng: 8.2847 })
      }
    }
    getUserLocation()
  }, [])

  // Fetch businesses when location, search, filters, or radius change
  useEffect(() => {
    if (userLocation) {
      fetchBusinesses()
    }
  }, [userLocation, searchQuery, filters, favorites, radius])

  const fetchBusinesses = async () => {
    if (!userLocation) return

    try {
      setLoading(true)
      
      const searchParams: any = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radius: radius, // Use user-selected radius
        limit: 20,
      }

      if (searchQuery) searchParams.q = searchQuery
      if (filters.verified_only) searchParams.verified_only = true
      if (filters.open_now) searchParams.open_now = true
      if (filters.featured_only) searchParams.featured = true

      const response = await apiService.searchBusinesses(searchParams)
      
      console.log('📦 API Response - businesses:', response.businesses.length)
      response.businesses.forEach((b: any, i: number) => {
        console.log(`  ${i}: ${b.name} - lat: ${b.latitude}, lng: ${b.longitude}`)
      })
      
      let filteredBusinesses = response.businesses
      if (filters.featured_only) {
        filteredBusinesses = filteredBusinesses.filter((b: any) => b.is_featured)
      }

      const businessesWithFavorites = filteredBusinesses.map((b: any) => ({
        ...b,
        isFavorite: favorites.has(b.id)
      }))

      setBusinesses(businessesWithFavorites)
    } catch (error) {
      console.error('Error fetching businesses:', error)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const handleRadiusChange = useCallback((newRadius: number) => {
    console.log('Radius changed to:', newRadius, 'km')
    setRadius(newRadius)
  }, [])

  const handleFavoriteToggle = useCallback(async (businessId: string, isFavorite: boolean) => {
    console.log(`💛 ${isFavorite ? 'Adding' : 'Removing'} favorite: ${businessId}`)
    
    const newFavorites = new Set(favorites)
    
    if (isFavorite) {
      newFavorites.add(businessId)
      
      // Sync to backend if logged in - FIXED: businessId in URL, not body
      if (user) {
        try {
          const token = await user.getIdToken()
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          })
          
          if (response.ok) {
            console.log('✅ Favorite saved to backend')
          } else {
            const errorText = await response.text()
            console.log('⚠️ Backend save failed:', response.status, errorText)
          }
        } catch (error) {
          console.error('❌ Failed to save favorite to backend:', error)
        }
      }
    } else {
      newFavorites.delete(businessId)
      
      // Sync to backend if logged in - DELETE with businessId in URL
      if (user) {
        try {
          const token = await user.getIdToken()
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          })
          
          if (response.ok) {
            console.log('✅ Favorite removed from backend')
          } else {
            const errorText = await response.text()
            console.log('⚠️ Backend delete failed:', response.status, errorText)
          }
        } catch (error) {
          console.error('❌ Failed to remove favorite from backend:', error)
        }
      }
    }
    
    setFavorites(newFavorites)
    localStorage.setItem('lokolo_favorites', JSON.stringify(Array.from(newFavorites)))
    console.log(`📦 Favorites count: ${newFavorites.size}`)
    
    setBusinesses(prev => 
      prev.map((b: any) => 
        b.id === businessId ? { ...b, isFavorite } : b
      )
    )
  }, [favorites, user])

  const handlePinClick = (businessId: string) => {
    setSelectedBusiness(businessId)
  }

  const handleCardClick = (businessId: string) => {
    router.push(`/business/${businessId}`)
  }

  const handleViewFavorites = () => {
    router.push('/favorites')
  }

  return (
    <main className="h-screen w-full overflow-hidden bg-cream relative">
      <TopNavigation 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onRadiusChange={handleRadiusChange}
        currentRadius={radius}
      />

      <div className="relative" style={{ height: 'calc(100vh - 160px)' }}>
        {userLocation ? (
          <MapView
            businesses={businesses}
            userLocation={userLocation}
            selectedBusinessId={selectedBusiness}
            onPinClick={handlePinClick}
          />
        ) : (
          <div className="w-full h-full bg-map-bg flex items-center justify-center">
            <p className="text-text-secondary">Loading map...</p>
          </div>
        )}
        
        {/* Floating Favorites Button - Only when logged in AND has favorites */}
        {user && favorites.size > 0 && (
          <button
            onClick={handleViewFavorites}
            className="absolute top-4 right-4 w-14 h-14 rounded-full bg-gold shadow-xl flex items-center justify-center hover:bg-[#FDB750] active:scale-95 transition-all z-30"
            aria-label="View Favorites"
          >
            <span className="text-2xl">❤️</span>
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-teal text-white text-xs font-bold rounded-full flex items-center justify-center">
              {favorites.size}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-cream rounded-t-3xl shadow-2xl transition-all"
        style={{
          height: '40vh',
          maxHeight: '80vh',
          boxShadow: '0 -4px 20px rgba(45, 24, 16, 0.15)',
        }}
      >
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: '#C4B5A6' }} />
        </div>

        <div className="px-4 pb-4 h-full overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              Nearby businesses ({businesses.length})
            </h2>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-text-secondary">Finding businesses nearby...</p>
              </div>
            </div>
          )}

          {!loading && businesses.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-text-primary font-semibold mb-1">No businesses found</p>
                <p className="text-text-secondary text-sm">
                  Try adjusting your location or filters
                </p>
              </div>
            </div>
          )}

          {!loading && businesses.length > 0 && (
            <div className="space-y-0">
              {businesses.map((business: any) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onClick={() => handleCardClick(business.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  isSelected={selectedBusiness === business.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
