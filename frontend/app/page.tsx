'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TopNavigation from '@/components/TopNavigation'
import MapView from '@/components/MapView'
import BottomSheet from '@/components/BottomSheet'
import BusinessCard from '@/components/BusinessCard'
import { apiService } from '@/lib/api/businesses'

interface FilterState {
  verified_only?: boolean
  open_now?: boolean
  featured_only?: boolean
}

export default function Home() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('lokolo_favorites')
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  // Get user location on mount
  useEffect(() => {
    // TEMPORARY: Force Johannesburg for testing (since sample businesses are there)
    setUserLocation({ lat: -26.2041, lng: 28.0473 })
    
    /* Original code - enable this when you have businesses in Switzerland
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Default to Johannesburg if location denied
          setUserLocation({ lat: -26.2041, lng: 28.0473 })
        }
      )
    } else {
      // Default to Johannesburg
      setUserLocation({ lat: -26.2041, lng: 28.0473 })
    }
    */
  }, [])

  // Fetch businesses when location, search, or filters change
  useEffect(() => {
    if (userLocation) {
      fetchBusinesses()
    }
  }, [userLocation, searchQuery, filters])

  const fetchBusinesses = async () => {
    if (!userLocation) return

    try {
      setLoading(true)
      console.log('Fetching businesses with:', { searchQuery, filters })
      
      // Build search params
      const searchParams: any = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radius: 10,
        limit: 20,
      }

      // Add search query if present
      if (searchQuery) {
        searchParams.q = searchQuery
      }

      // Add filters
      if (filters.verified_only) {
        searchParams.verified_only = true
      }
      
      if (filters.open_now) {
        searchParams.open_now = true
      }
      
      if (filters.featured_only) {
        searchParams.featured = true
      }

      // Call backend API
      const response = await apiService.searchBusinesses(searchParams)

      console.log('Received businesses:', response.businesses.length)
      
      // Client-side filter for featured if backend doesn't support it yet
      let filteredBusinesses = response.businesses
      if (filters.featured_only) {
        filteredBusinesses = filteredBusinesses.filter((b: any) => b.is_featured)
      }

      // Add favorite status to businesses
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
    console.log('Search query:', query)
    setSearchQuery(query)
  }, [])

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    console.log('Filters changed:', newFilters)
    setFilters(newFilters)
  }, [])

  const handleFavoriteToggle = useCallback(async (businessId: string, isFavorite: boolean) => {
    const newFavorites = new Set(favorites)
    
    if (isFavorite) {
      // Add to favorites
      newFavorites.add(businessId)
      
      // TODO: Call API when authentication is ready
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${idToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ business_id: businessId }),
      // })
    } else {
      // Remove from favorites
      newFavorites.delete(businessId)
      
      // TODO: Call API when authentication is ready
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${idToken}` },
      // })
    }
    
    setFavorites(newFavorites)
    
    // Save to localStorage
    localStorage.setItem('lokolo_favorites', JSON.stringify(Array.from(newFavorites)))
    
    // Update businesses list with new favorite status
    setBusinesses(prev => 
      prev.map((b: any) => 
        b.id === businessId ? { ...b, isFavorite } : b
      )
    )
  }, [favorites])

  const handlePinClick = (businessId: string) => {
    setSelectedBusiness(businessId)
  }

  const handleCardClick = (businessId: string) => {
    console.log('Navigate to business:', businessId)
    router.push(`/business/${businessId}`)
  }

  const handleViewFavorites = () => {
    router.push('/favorites')
  }

  return (
    <main className="h-screen w-full overflow-hidden bg-cream relative">
      {/* Top Navigation with Search & Filters */}
      <TopNavigation 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {/* Map Area */}
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
        
        {/* Favorites Link - Floating Button INSIDE Map Area */}
        {favorites.size > 0 && (
          <button
            onClick={handleViewFavorites}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '56px',
              height: '56px',
              zIndex: 30,
            }}
            className="rounded-full bg-gold shadow-xl flex items-center justify-center hover:bg-[#FDB750] active:scale-95 transition-all"
            aria-label="View Favorites"
          >
            <span className="text-2xl">❤️</span>
            <span 
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '24px',
                height: '24px',
              }}
              className="bg-teal text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {favorites.size}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Sheet with Custom Content */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-cream rounded-t-3xl shadow-2xl transition-all"
        style={{
          height: '40vh',
          maxHeight: '80vh',
          boxShadow: '0 -4px 20px rgba(45, 24, 16, 0.15)',
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div
            className="w-12 h-1.5 rounded-full bg-disabled"
            style={{ width: '48px', height: '6px', backgroundColor: '#C4B5A6' }}
          />
        </div>

        {/* Content */}
        <div className="px-4 pb-4 h-full overflow-y-auto">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-text-primary">
              Nearby businesses ({businesses.length})
            </h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-text-secondary">Finding businesses nearby...</p>
              </div>
            </div>
          )}

          {/* Empty State */}
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

          {/* Business Cards with Favorites */}
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
