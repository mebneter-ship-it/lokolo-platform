'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiService } from '@/lib/api/businesses'

interface BusinessHour {
  day_of_week: string
  opens_at: string
  closes_at: string
  is_closed: boolean
}

interface Photo {
  url: string
  caption?: string
}

interface Business {
  id: string
  name: string
  short_description?: string
  category?: string
  distance?: number
  is_verified?: boolean
  is_featured?: boolean
  is_favorited?: boolean
  logo_url?: string
  photos?: Photo[]
  rating?: number
  favorite_count?: number
  location?: {
    latitude: number
    longitude: number
    address_text: string
  }
  contacts?: {
    phone?: string
    email?: string
    website_url?: string
    whatsapp?: string
    facebook_url?: string
    instagram_url?: string
    twitter_url?: string
    linkedin_url?: string
    tiktok_url?: string
  }
  business_hours?: BusinessHour[]
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const businessId = params.id as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    if (businessId) {
      fetchBusinessDetail()
    }
  }, [businessId])

  const fetchBusinessDetail = async () => {
    try {
      setLoading(true)
      const data = await apiService.getBusinessById(businessId)
      setBusiness(data)
      setIsFavorited(data.is_favorited || false)
    } catch (error) {
      console.error('Error fetching business:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if business is currently open
  const getOpenStatus = () => {
    if (!business?.business_hours || business.business_hours.length === 0) {
      return { isOpen: null, text: 'Hours not available' }
    }

    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()]
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const todayHours = business.business_hours.find(h => h.day_of_week.toLowerCase() === currentDay)
    
    if (!todayHours || todayHours.is_closed) {
      // Find next open day
      return { isOpen: false, text: 'Closed today' }
    }

    const [openHour, openMin] = todayHours.opens_at.split(':').map(Number)
    const [closeHour, closeMin] = todayHours.closes_at.split(':').map(Number)
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin

    if (currentTime >= openTime && currentTime < closeTime) {
      return { isOpen: true, text: `Open · Closes ${formatTime(todayHours.closes_at)}` }
    } else if (currentTime < openTime) {
      return { isOpen: false, text: `Closed · Opens ${formatTime(todayHours.opens_at)}` }
    } else {
      return { isOpen: false, text: 'Closed' }
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hour, minute] = time.split(':').map(Number)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
  }

  const handleFavoriteToggle = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setFavoriteLoading(true)
      const token = await user.getIdToken()

      if (isFavorited) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        })
        setIsFavorited(false)
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/favorites/${businessId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        })
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: business?.name || 'Check out this business on Lokolo',
      text: business?.short_description || `${business?.name} - Found on Lokolo`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // User cancelled or error - fallback to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }

  const handleCall = () => {
    if (business?.contacts?.phone) {
      window.location.href = `tel:${business.contacts.phone}`
    }
  }

  const handleWhatsApp = () => {
    const phone = business?.contacts?.whatsapp || business?.contacts?.phone
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  const handleEmail = () => {
    if (business?.contacts?.email) {
      window.location.href = `mailto:${business.contacts.email}`
    }
  }

  const handleWebsite = () => {
    if (business?.contacts?.website_url) {
      let url = business.contacts.website_url
      if (!url.startsWith('http')) url = 'https://' + url
      window.open(url, '_blank')
    }
  }

  const handleDirections = () => {
    if (business?.location) {
      const { latitude, longitude } = business.location
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank')
    }
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return ''
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  // Get category gradient for fallback
  const getCategoryGradient = () => {
    const cat = business?.category?.toLowerCase() || ''
    if (cat.includes('coffee') || cat.includes('food') || cat.includes('restaurant') || cat.includes('bakery')) {
      return 'from-gold to-orange'
    }
    if (cat.includes('fashion') || cat.includes('retail') || cat.includes('shop')) {
      return 'from-orange to-gold'
    }
    return 'from-teal to-gold'
  }

  // Get category emoji
  const getCategoryEmoji = () => {
    const cat = business?.category?.toLowerCase() || ''
    if (cat.includes('coffee')) return '☕'
    if (cat.includes('bakery') || cat.includes('bread')) return '🥐'
    if (cat.includes('restaurant') || cat.includes('food')) return '🍽️'
    if (cat.includes('fashion') || cat.includes('clothing')) return '👗'
    if (cat.includes('beauty') || cat.includes('salon')) return '💇'
    if (cat.includes('tech') || cat.includes('electronic')) return '💻'
    return '🏪'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-text-primary text-lg mb-4">Business not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold min-h-[48px]"
          >
            Back to Map
          </button>
        </div>
      </div>
    )
  }

  // Build photo gallery - only use valid URLs
  const allPhotos: Photo[] = []
  if (business.logo_url && business.logo_url.startsWith('http')) {
    allPhotos.push({ url: business.logo_url, caption: 'Logo' })
  }
  if (business.photos) {
    business.photos.forEach(p => {
      if (p.url && p.url.startsWith('http')) {
        allPhotos.push(p)
      }
    })
  }

  const openStatus = getOpenStatus()
  const hasPhotos = allPhotos.length > 0

  return (
    <div className="min-h-screen bg-cream pb-40">
      {/* Sticky Header with Back, Favorite, Share */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between p-3 max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-cream hover:bg-gold/20 active:scale-95 transition-all"
            aria-label="Go back"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Business Name - Center */}
          <h1 className="text-base font-bold text-text-primary truncate px-2 max-w-[200px]">
            {business.name}
          </h1>
          
          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-95 ${
                isFavorited ? 'bg-red-50' : 'bg-cream hover:bg-gold/20'
              } ${favoriteLoading ? 'opacity-50' : ''}`}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? (
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
            
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-cream hover:bg-gold/20 active:scale-95 transition-all"
              aria-label="Share"
            >
              <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image/Photo */}
      <div className="relative h-56 sm:h-64">
        {hasPhotos ? (
          <>
            <img
              src={allPhotos[currentPhotoIndex].url}
              alt={business.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, hide it
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            {/* Photo navigation dots */}
            {allPhotos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                {allPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentPhotoIndex ? 'bg-white w-5' : 'bg-white/50 w-2'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Gradient fallback with icon when no photos */
          <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient()} flex items-center justify-center`}>
            <div className="text-center text-white/90">
              <span className="text-6xl mb-2 block">{getCategoryEmoji()}</span>
              <span className="text-sm font-medium">{business.category || 'Business'}</span>
            </div>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-2">
          {business.is_verified && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal text-white shadow">
              ✓ Verified
            </span>
          )}
          {business.is_featured && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gold text-text-primary shadow">
              ★ Featured
            </span>
          )}
        </div>
      </div>

      {/* Business Info */}
      <div className="p-4 max-w-2xl mx-auto">
        {/* Name */}
        <h1 className="text-2xl font-bold text-text-primary mb-2">{business.name}</h1>
        
        {/* Rating & Category */}
        <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
          <span className="flex items-center gap-1">
            <span className="text-gold">⭐</span>
            <span className="font-semibold text-text-primary">{business.rating || '4.5'}</span>
          </span>
          {business.category && (
            <>
              <span className="text-text-secondary">•</span>
              <span className="text-text-secondary">{business.category}</span>
            </>
          )}
        </div>

        {/* Open/Closed Status */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium mb-4 ${
          openStatus.isOpen === true ? 'bg-teal/10 text-teal' : 
          openStatus.isOpen === false ? 'bg-orange/10 text-orange' : 
          'bg-cream text-text-secondary'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            openStatus.isOpen === true ? 'bg-teal' : 
            openStatus.isOpen === false ? 'bg-orange' : 
            'bg-text-secondary'
          }`}></span>
          {openStatus.text}
        </div>

        {/* Address */}
        {business.location?.address_text && (
          <div className="flex items-start gap-2 mb-3">
            <span className="text-gold mt-0.5">📍</span>
            <div>
              <p className="text-text-primary">{business.location.address_text}</p>
              {business.distance !== undefined && (
                <p className="text-text-secondary text-sm">{formatDistance(business.distance)} away</p>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2 mb-5">
          {business.contacts?.phone && (
            <a href={`tel:${business.contacts.phone}`} className="flex items-center gap-2 text-text-primary hover:text-teal transition-colors">
              <span className="text-teal">📞</span>
              {business.contacts.phone}
            </a>
          )}
          {business.contacts?.email && (
            <a href={`mailto:${business.contacts.email}`} className="flex items-center gap-2 text-text-primary hover:text-teal transition-colors">
              <span className="text-teal">✉️</span>
              {business.contacts.email}
            </a>
          )}
          {business.contacts?.website_url && (
            <a href={business.contacts.website_url.startsWith('http') ? business.contacts.website_url : `https://${business.contacts.website_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-primary hover:text-teal transition-colors truncate">
              <span className="text-teal">🌐</span>
              {business.contacts.website_url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {/* About */}
        {business.short_description && (
          <div className="mb-5">
            <h2 className="font-bold text-text-primary mb-2">About</h2>
            <p className="text-text-secondary leading-relaxed">{business.short_description}</p>
          </div>
        )}

        {/* Business Hours */}
        {business.business_hours && business.business_hours.length > 0 && (
          <div className="mb-5">
            <h2 className="font-bold text-text-primary mb-2">Business Hours</h2>
            <div className="bg-white rounded-xl p-4 border border-cream shadow-sm">
              <div className="space-y-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const hours = business.business_hours?.find(h => h.day_of_week.toLowerCase() === day)
                  const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day
                  return (
                    <div key={day} className={`flex justify-between text-sm ${isToday ? 'font-semibold text-teal' : 'text-text-primary'}`}>
                      <span className="capitalize">{day}</span>
                      <span>
                        {!hours || hours.is_closed ? (
                          <span className="text-text-secondary">Closed</span>
                        ) : (
                          `${formatTime(hours.opens_at)} - ${formatTime(hours.closes_at)}`
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Social Media Links */}
        {(business.contacts?.instagram_url || business.contacts?.facebook_url || business.contacts?.twitter_url || business.contacts?.tiktok_url) && (
          <div className="mb-5">
            <h2 className="font-bold text-text-primary mb-2">Follow Us</h2>
            <div className="flex gap-3">
              {business.contacts.instagram_url && (
                <a href={business.contacts.instagram_url} target="_blank" rel="noopener noreferrer" 
                   className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {business.contacts.facebook_url && (
                <a href={business.contacts.facebook_url} target="_blank" rel="noopener noreferrer"
                   className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {business.contacts.twitter_url && (
                <a href={business.contacts.twitter_url} target="_blank" rel="noopener noreferrer"
                   className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {business.contacts.tiktok_url && (
                <a href={business.contacts.tiktok_url} target="_blank" rel="noopener noreferrer"
                   className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream p-4 shadow-lg z-40">
        <div className="max-w-2xl mx-auto">
          {/* Primary row */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            {business.contacts?.phone && (
              <button
                onClick={handleCall}
                className="flex items-center justify-center gap-2 py-3.5 bg-gold text-text-primary rounded-xl font-semibold active:scale-[0.98] transition-transform min-h-[48px] shadow-sm"
              >
                📞 Call
              </button>
            )}
            {(business.contacts?.whatsapp || business.contacts?.phone) && (
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white rounded-xl font-semibold active:scale-[0.98] transition-transform min-h-[48px] shadow-sm"
              >
                💬 WhatsApp
              </button>
            )}
          </div>

          {/* Secondary row */}
          <div className="grid grid-cols-3 gap-2">
            {business.contacts?.email && (
              <button
                onClick={handleEmail}
                className="flex items-center justify-center gap-1 py-2.5 bg-teal text-white rounded-xl font-medium text-sm active:scale-[0.98] transition-transform min-h-[44px]"
              >
                ✉️ Email
              </button>
            )}
            {business.contacts?.website_url && (
              <button
                onClick={handleWebsite}
                className="flex items-center justify-center gap-1 py-2.5 bg-orange text-white rounded-xl font-medium text-sm active:scale-[0.98] transition-transform min-h-[44px]"
              >
                🌐 Web
              </button>
            )}
            {business.location && (
              <button
                onClick={handleDirections}
                className="flex items-center justify-center gap-1 py-2.5 bg-white border-2 border-gold text-text-primary rounded-xl font-medium text-sm active:scale-[0.98] transition-transform min-h-[44px]"
              >
                📍 Map
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
