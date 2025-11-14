'use client'

import { useState, useEffect } from 'react'
import TopNavigation from '@/components/TopNavigation'
import MapView from '@/components/MapView'
import BottomSheet from '@/components/BottomSheet'
import { apiService } from '@/lib/api/businesses'

export default function Home() {
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)

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

  // Fetch nearby businesses when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyBusinesses(userLocation.lat, userLocation.lng)
    }
  }, [userLocation])

  const fetchNearbyBusinesses = async (lat: number, lng: number) => {
    try {
      setLoading(true)
      console.log('Fetching businesses for:', lat, lng)
      
      // Call real backend API
const response = await apiService.searchBusinesses({
  latitude: lat,
  longitude: lng,
  radius: 10,
  limit: 20,
})

console.log('Received businesses:', response.businesses.length)
console.log('First business:', response.businesses[0])
console.log('First business lat/lng:', response.businesses[0]?.latitude, response.businesses[0]?.longitude)
setBusinesses(response.businesses)
    } catch (error) {
      console.error('Error fetching businesses:', error)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  const handlePinClick = (businessId: string) => {
    setSelectedBusiness(businessId)
  }

  const handleCardClick = (businessId: string) => {
    console.log('Navigate to business:', businessId)
  }

  return (
    <main className="h-screen w-full overflow-hidden bg-cream">
      {/* Top Navigation */}
      <TopNavigation />

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
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        businesses={businesses}
        selectedBusinessId={selectedBusiness}
        onCardClick={handleCardClick}
        loading={loading}
      />
    </main>
  )
}