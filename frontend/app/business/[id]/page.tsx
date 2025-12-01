'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface BusinessHour {
  day_of_week: string
  opens_at: string | null
  closes_at: string | null
  is_closed: boolean
}

interface Photo {
  url: string
  caption?: string
}

interface UserRating {
  id: string
  rating: number
  review_text?: string
  created_at: string
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
  total_ratings?: number
  user_rating?: UserRating | null
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  useEffect(() => {
    if (businessId) {
      fetchBusinessDetail()
    }
  }, [businessId])

  // Fetch user role to check if consumer
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null)
        return
      }
      
      try {
        const token = await user.getIdToken()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (response.ok) {
          const result = await response.json()
          setUserRole(result.data?.role || null)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }
    
    fetchUserRole()
  }, [user])

  const fetchBusinessDetail = async () => {
    try {
      setLoading(true)
      
      // Fetch directly from API to get all data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}`)
      if (!response.ok) throw new Error('Failed to fetch business')
      
      const result = await response.json()
      const data = result.data
      
      console.log('📦 Raw API response:', data)
      console.log('📅 Business hours from API:', data.business_hours)
      
      // Transform to our format
      const transformed: Business = {
        id: data.id,
        name: data.name,
        short_description: data.tagline || data.description,
        category: data.categories?.[0] || 'Business',
        is_verified: data.verification_status === 'approved',
        is_featured: data.metadata?.featured === true,
        is_favorited: data.is_favorited || false,
        rating: data.rating || 0,
        total_ratings: data.total_ratings || 0,
        user_rating: data.user_rating || null,
        logo_url: data.logo_url,
        photos: data.photos?.map((p: any) => ({ url: p.url, caption: p.alt_text })) || [],
        distance: data.distance_km,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          address_text: data.address_line1 
            ? `${data.address_line1}, ${data.city}`
            : data.city || '',
        },
        contacts: {
          phone: data.phone_number,
          email: data.email,
          website_url: data.website_url,
          whatsapp: data.whatsapp_number,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          twitter_url: data.twitter_url,
          linkedin_url: data.linkedin_url,
          tiktok_url: data.tiktok_url,
        },
        business_hours: data.business_hours || [],
        favorite_count: data.favorite_count || 0,
      }
      
      console.log('📅 Transformed business_hours:', transformed.business_hours)
      
      setBusiness(transformed)
      setIsFavorited(transformed.is_favorited || false)
    } catch (error) {
      console.error('Error fetching business:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if business is currently open
  const getOpenStatus = () => {
    if (!business?.business_hours || business.business_hours.length === 0) {
      return { isOpen: null, text: 'Hours not available', className: 'bg-cream text-text-secondary' }
    }

    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()]
    const currentTime = now.getHours() * 60 + now.getMinutes()

    const todayHours = business.business_hours.find(h => h.day_of_week.toLowerCase() === currentDay)
    
    if (!todayHours || todayHours.is_closed) {
      return { isOpen: false, text: 'Closed today', className: 'bg-orange/10 text-orange' }
    }

    if (!todayHours.opens_at || !todayHours.closes_at) {
      return { isOpen: null, text: 'Hours not set', className: 'bg-cream text-text-secondary' }
    }

    const [openHour, openMin] = todayHours.opens_at.split(':').map(Number)
    const [closeHour, closeMin] = todayHours.closes_at.split(':').map(Number)
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin

    if (currentTime >= openTime && currentTime < closeTime) {
      return { 
        isOpen: true, 
        text: `Open · Closes ${formatTime(todayHours.closes_at)}`,
        className: 'bg-teal/10 text-teal'
      }
    } else if (currentTime < openTime) {
      return { 
        isOpen: false, 
        text: `Closed · Opens ${formatTime(todayHours.opens_at)}`,
        className: 'bg-orange/10 text-orange'
      }
    } else {
      return { isOpen: false, text: 'Closed', className: 'bg-orange/10 text-orange' }
    }
  }

  const formatTime = (time: string | null) => {
    if (!time) return ''
    const [hour, minute] = time.split(':').map(Number)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
  }

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
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
          headers: { 
            'Authorization': `Bearer ${token}`,
          },
        })
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleCall = () => {
    if (business?.contacts?.phone) {
      window.location.href = `tel:${business.contacts.phone}`
    }
  }

  const handleWhatsApp = () => {
    const number = business?.contacts?.whatsapp || business?.contacts?.phone
    if (number) {
      const cleaned = number.replace(/\D/g, '')
      window.open(`https://wa.me/${cleaned}`, '_blank')
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.name || 'Check out this business',
          text: business?.short_description || '',
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    }
  }

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxImage(null)
  }

  // Submit rating
  const handleSubmitRating = async (rating: number, reviewText?: string) => {
    if (!user) {
      throw new Error('You must be logged in to rate')
    }
    
    const token = await user.getIdToken()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}/ratings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating, review_text: reviewText }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to submit rating')
    }
    
    const result = await response.json()
    
    // Update local state with new rating
    if (business) {
      setBusiness({
        ...business,
        rating: result.data.new_average,
        total_ratings: result.data.total_ratings,
        user_rating: result.data.rating,
      })
    }
  }

  // Quick rate - one-click star rating
  const handleQuickRate = async (rating: number) => {
    if (!user) {
      router.push('/login')
      return
    }
    
    setRatingSubmitting(true)
    
    try {
      await handleSubmitRating(rating)
    } catch (error) {
      console.error('Rating error:', error)
      // Could show a toast here
    } finally {
      setRatingSubmitting(false)
    }
  }

  // Check if user can rate (consumer only, not business owner)
  const canRate = userRole === 'consumer'

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

  // Build photo gallery - ONLY actual photos, NOT logo
  const allPhotos: Photo[] = business.photos && business.photos.length > 0 
    ? business.photos 
    : []

  const openStatus = getOpenStatus()

  return (
    <div className="min-h-screen bg-cream pb-40">
      {/* Header - Orange to Gold Gradient */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold">
        <div className="flex items-center justify-between p-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Logo + Business Name */}
          <div className="flex items-center gap-3 flex-1 justify-center mx-2">
            {business.logo_url && (
              <img 
                src={business.logo_url} 
                alt={`${business.name} logo`}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/50 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => openLightbox(business.logo_url!)}
              />
            )}
            <h1 className="text-lg font-bold text-white truncate">
              {business.name}
            </h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              {isFavorited ? (
                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
            
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Photo Carousel - Only actual photos */}
      {allPhotos.length > 0 ? (
        <div className="relative h-64 bg-gray-100">
          <img
            src={allPhotos[currentPhotoIndex].url}
            alt={allPhotos[currentPhotoIndex].caption || business.name}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => openLightbox(allPhotos[currentPhotoIndex].url)}
          />
          
          {/* Badges Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            {business.is_verified && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal text-white shadow-lg">
                ✓ Verified
              </span>
            )}
            {business.is_featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gold text-text-primary shadow-lg">
                ★ Featured
              </span>
            )}
          </div>

          {/* Photo Navigation Dots */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {allPhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentPhotoIndex ? 'bg-gold w-6' : 'bg-white/60 w-2'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Previous/Next Buttons */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-md"
              >
                <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-md"
              >
                <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      ) : (
        // Gradient fallback when no photos - show logo if available
        <div className={`h-48 bg-gradient-to-br ${getCategoryGradient()} flex items-center justify-center relative`}>
          {business.logo_url ? (
            <img 
              src={business.logo_url} 
              alt={`${business.name} logo`}
              className="w-28 h-28 rounded-2xl object-cover border-4 border-white/30 shadow-lg cursor-pointer hover:scale-105 transition-transform"
              onClick={() => openLightbox(business.logo_url!)}
            />
          ) : (
            <svg width={64} height={64} viewBox="0 0 24 24" fill="none" className="text-white/50">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2"/>
            </svg>
          )}
          {/* Badges on gradient fallback */}
          <div className="absolute top-4 right-4 flex gap-2">
            {business.is_verified && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal text-white shadow-lg">
                ✓ Verified
              </span>
            )}
            {business.is_featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gold text-text-primary shadow-lg">
                ★ Featured
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Business Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-cream -mt-6 relative z-10 mb-4">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{business.name}</h1>
          
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {/* Rating Display + Interactive Stars for Consumers */}
            <div className="flex items-center gap-2">
              {/* Show average rating */}
              <div className="flex items-center gap-1">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="#F5A623">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                <span className="font-semibold text-text-primary">
                  {business.rating && business.rating > 0 ? business.rating.toFixed(1) : '—'}
                </span>
                <span className="text-text-secondary text-sm">
                  ({business.total_ratings || 0})
                </span>
              </div>
              
              {/* Separator */}
              {canRate && <span className="text-cream">|</span>}
              
              {/* Interactive Stars for Consumers */}
              {canRate && (
                <div className="flex items-center gap-1">
                  <span className="text-text-secondary text-xs mr-1">
                    {business.user_rating ? 'Your rating:' : 'Rate:'}
                  </span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleQuickRate(star)}
                      disabled={ratingSubmitting}
                      className="transition-transform hover:scale-125 active:scale-95 disabled:opacity-50"
                      aria-label={`Rate ${star} stars`}
                    >
                      <svg 
                        width={20} 
                        height={20} 
                        viewBox="0 0 24 24" 
                        fill={business.user_rating && star <= business.user_rating.rating ? '#F5A623' : '#E8DED0'}
                        className="transition-colors"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </button>
                  ))}
                  {ratingSubmitting && (
                    <svg className="w-4 h-4 animate-spin ml-1 text-gold" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            
            {/* Category */}
            <span className="text-text-secondary">•</span>
            <span className="text-text-secondary">{business.category}</span>
            
            {/* Distance */}
            {business.distance && (
              <>
                <span className="text-text-secondary">•</span>
                <span className="text-text-secondary">
                  {business.distance < 1 
                    ? `${Math.round(business.distance * 1000)}m` 
                    : `${business.distance.toFixed(1)}km`}
                </span>
              </>
            )}
          </div>
          
          {/* Open Status */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${openStatus.className}`}>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {openStatus.text}
          </div>
          
          {/* Description */}
          {business.short_description && (
            <p className="text-text-secondary mt-4 leading-relaxed">
              {business.short_description}
            </p>
          )}
        </div>

        {/* Location Card */}
        {business.location?.address_text && (
          <div className="bg-white rounded-2xl shadow-md p-6 border border-cream mb-4">
            <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
                            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-orange">
                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#B85C1A" strokeWidth="2" fill="#B85C1A"/>
                <circle cx="12" cy="10" r="3" fill="#156B60"/>
              </svg>
              Location
            </h2>
            <p className="text-text-secondary">{business.location.address_text}</p>
            <button
              onClick={handleDirections}
              className="mt-3 flex items-center gap-2 text-gold font-semibold hover:text-orange transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Get Directions
            </button>
          </div>
        )}

        {/* Business Hours Card */}
        {business.business_hours && business.business_hours.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6 border border-cream mb-4">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-gold">
                <circle cx="12" cy="12" r="10" stroke="#F5A623" strokeWidth="2" fill="#F5A623" fillOpacity="0.1"/>
                <path d="M12 6V12L16 14" stroke="#156B60" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Business Hours
            </h2>
            <div className="space-y-3">
              {business.business_hours.map((hours) => {
                const now = new Date()
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                const isToday = hours.day_of_week.toLowerCase() === dayNames[now.getDay()]
                
                return (
                  <div 
                    key={hours.day_of_week} 
                    className={`flex justify-between items-center py-2 ${isToday ? 'bg-gold/10 -mx-2 px-2 rounded-lg' : ''}`}
                  >
                    <span className={`font-medium ${isToday ? 'text-gold' : 'text-text-primary'}`}>
                      {formatDayName(hours.day_of_week)}
                      {isToday && <span className="ml-2 text-xs">(Today)</span>}
                    </span>
                    <span className={hours.is_closed ? 'text-orange' : 'text-text-secondary'}>
                      {hours.is_closed 
                        ? 'Closed' 
                        : `${formatTime(hours.opens_at)} - ${formatTime(hours.closes_at)}`
                      }
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Social Media Card */}
        {(business.contacts?.instagram_url || business.contacts?.facebook_url || business.contacts?.twitter_url || business.contacts?.tiktok_url || business.contacts?.linkedin_url) && (
          <div className="bg-white rounded-2xl shadow-md p-6 border border-cream mb-4">
            <h2 className="text-lg font-bold text-text-primary mb-4">Follow Us</h2>
            <div className="flex flex-wrap gap-3">
              {business.contacts.instagram_url && (
                <a
                  href={business.contacts.instagram_url.startsWith('http') ? business.contacts.instagram_url : `https://instagram.com/${business.contacts.instagram_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {business.contacts.facebook_url && (
                <a
                  href={business.contacts.facebook_url.startsWith('http') ? business.contacts.facebook_url : `https://facebook.com/${business.contacts.facebook_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {business.contacts.twitter_url && (
                <a
                  href={business.contacts.twitter_url.startsWith('http') ? business.contacts.twitter_url : `https://x.com/${business.contacts.twitter_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {business.contacts.tiktok_url && (
                <a
                  href={business.contacts.tiktok_url.startsWith('http') ? business.contacts.tiktok_url : `https://tiktok.com/@${business.contacts.tiktok_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              )}
              {business.contacts.linkedin_url && (
                <a
                  href={business.contacts.linkedin_url.startsWith('http') ? business.contacts.linkedin_url : `https://linkedin.com/in/${business.contacts.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream p-4 shadow-lg z-40">
        <div className="max-w-2xl mx-auto">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Call Button */}
            {business.contacts?.phone && (
              <button
                onClick={handleCall}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gold text-text-primary rounded-xl font-semibold shadow-md hover:bg-[#E69515] active:scale-98 transition-all min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Call
              </button>
            )}

            {/* WhatsApp Button */}
            {(business.contacts?.whatsapp || business.contacts?.phone) && (
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl font-semibold shadow-md hover:bg-[#20BA5A] active:scale-98 transition-all min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-3 gap-3">
            {/* Email Button */}
            {business.contacts?.email && (
              <button
                onClick={handleEmail}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-teal text-white rounded-xl font-semibold shadow-md hover:bg-[#0E5A50] active:scale-98 transition-all min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email
              </button>
            )}

            {/* Website Button */}
            {business.contacts?.website_url && (
              <button
                onClick={handleWebsite}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-orange text-white rounded-xl font-semibold shadow-md hover:bg-[#8F4814] active:scale-98 transition-all min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
                Web
              </button>
            )}

            {/* Directions Button */}
            {business.location && (
              <button
                onClick={handleDirections}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-white border-2 border-gold text-text-primary rounded-xl font-semibold shadow-md hover:bg-gold active:scale-98 transition-all min-h-[48px]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Map
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Full Image */}
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
