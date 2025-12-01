'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface Business {
  id: string
  name: string
  latitude: number
  longitude: number
  verified?: boolean
  featured?: boolean
}

interface MapViewProps {
  businesses: Business[]
  userLocation: { lat: number; lng: number }
  selectedBusinessId: string | null
  onPinClick: (businessId: string) => void
}

export default function MapView({
  businesses,
  userLocation,
  selectedBusinessId,
  onPinClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      if (!apiKey) {
        console.error('Google Maps API key not found')
        return
      }

      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'marker'],
        })

        await loader.load()

        if (mapRef.current && !googleMapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current, {
            center: userLocation,
            zoom: 14,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          })

          // Add user location marker
          new google.maps.Marker({
            position: userLocation,
            map: googleMapRef.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: 'Your Location',
          })

          setIsLoaded(true)
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [userLocation])

  // Update business markers
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current.clear()

    // Add new markers
    console.log('🗺️ MapView received businesses:', businesses.length)
    businesses.forEach((business, index) => {
      console.log(`📍 Business ${index}: ${business.name}`, {
        lat: business.latitude,
        lng: business.longitude,
        hasCoords: !!(business.latitude && business.longitude)
      })
      if (!business.latitude || !business.longitude) return

      // Create custom pin icon (gold with teal center) - using data URL for reliability
      const pinSvg = `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C9.4 0 4 5.4 4 12c0 9 12 28 12 28s12-19 12-28c0-6.6-5.4-12-12-12z" fill="#F5A623" stroke="#FFFFFF" stroke-width="1.5"/>
        <circle cx="16" cy="12" r="6" fill="#156B60"/>
      </svg>`;
      
      const pinIcon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(pinSvg),
        scaledSize: new google.maps.Size(32, 40),
        anchor: new google.maps.Point(16, 40),
      }

      const marker = new google.maps.Marker({
        position: { lat: business.latitude, lng: business.longitude },
        map: googleMapRef.current,
        icon: pinIcon,
        title: business.name,
      })

      // Add click listener
      marker.addListener('click', () => {
        onPinClick(business.id)
        
        // Animate selected pin
        marker.setAnimation(google.maps.Animation.BOUNCE)
        setTimeout(() => marker.setAnimation(null), 1500)
      })

      markersRef.current.set(business.id, marker)
    })
  }, [businesses, isLoaded, onPinClick])

  // Highlight selected business
  useEffect(() => {
    if (!selectedBusinessId) return

    markersRef.current.forEach((marker, id) => {
      if (id === selectedBusinessId) {
        marker.setAnimation(google.maps.Animation.BOUNCE)
        setTimeout(() => marker.setAnimation(null), 1500)
      }
    })
  }, [selectedBusinessId])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full bg-map-bg" />
      {!isLoaded && (
        <div className="absolute inset-0 bg-map-bg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-text-secondary">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
