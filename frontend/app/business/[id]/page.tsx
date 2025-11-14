'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiService } from '@/lib/api/businesses'

interface Business {
  id: string
  name: string
  short_description?: string
  category?: string
  distance?: number
  is_verified?: boolean
  is_featured?: boolean
  logo_url?: string
  rating?: number
  location?: {
    latitude: number
    longitude: number
    address_text: string
  }
  contacts?: {
    phone?: string
    email?: string
    website_url?: string
    messenger_url?: string
    social_instagram?: string
    social_facebook?: string
  }
  hours?: any
  photos?: Array<{
    url: string
    caption?: string
  }>
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

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
    } catch (error) {
      console.error('Error fetching business:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCall = () => {
    if (business?.contacts?.phone) {
      window.location.href = `tel:${business.contacts.phone}`
    }
  }

  const handleWhatsApp = () => {
    if (business?.contacts?.phone) {
      // Remove any non-digit characters and ensure it starts with country code
      const cleanPhone = business.contacts.phone.replace(/\D/g, '')
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
      window.open(business.contacts.website_url, '_blank')
    }
  }

  const handleDirections = () => {
    if (business?.location) {
      const { latitude, longitude } = business.location
      // Open in Google Maps
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
        console.log('Share failed:', error)
      }
    }
  }

  const getCategoryEmoji = (category?: string) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('coffee')) return '☕'
    if (cat.includes('food') || cat.includes('restaurant')) return '🍽️'
    if (cat.includes('fashion') || cat.includes('clothing')) return '👗'
    if (cat.includes('beauty') || cat.includes('salon')) return '💅'
    if (cat.includes('tech')) return '💻'
    return '🏪'
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return ''
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading business details...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary text-lg mb-4">Business not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold"
          >
            Back to Map
          </button>
        </div>
      </div>
    )
  }

  // Photo gallery (logo + up to 3 photos)
  const allPhotos = [
    ...(business.logo_url ? [{ url: business.logo_url, caption: 'Logo' }] : []),
    ...(business.photos || [])
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-cream text-text-primary hover:bg-gold transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-cream text-text-primary hover:bg-gold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Photo Gallery */}
      {allPhotos.length > 0 && (
        <div className="relative h-80 bg-map-bg">
          <img
            src={allPhotos[currentPhotoIndex].url}
            alt={allPhotos[currentPhotoIndex].caption || business.name}
            className="w-full h-full object-cover"
          />
          
          {/* Badges Overlay */}
          <div className="absolute top-4 right-4 flex gap-2">
            {business.is_verified && (
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-teal text-white shadow-lg">
                ✓ Verified
              </span>
            )}
            {business.is_featured && (
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gold text-text-primary shadow-lg">
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
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPhotoIndex ? 'bg-gold w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Previous/Next Photo Buttons */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Business Information */}
      <div className="p-6">
        {/* Title and Rating */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {business.name}
          </h1>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gold">⭐</span>
              <span className="text-text-primary font-semibold">{business.rating || 4.8}</span>
              <span className="text-text-secondary">(127 reviews)</span>
            </div>
            {business.category && (
              <span className="px-2 py-1 bg-white rounded-full text-text-secondary text-xs font-medium">
                {getCategoryEmoji(business.category)} {business.category}
              </span>
            )}
          </div>
        </div>

        {/* Location and Distance */}
        {business.location && (
          <div className="flex items-start gap-2 mb-4 text-text-secondary">
            <svg className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-text-primary">{business.location.address_text}</p>
              {business.distance && (
                <p className="text-sm">{formatDistance(business.distance)} away</p>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(business.contacts?.phone || business.contacts?.email) && (
          <div className="mb-6 space-y-2">
            {business.contacts.phone && (
              <div className="flex items-center gap-2 text-text-secondary">
                <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <a href={`tel:${business.contacts.phone}`} className="text-text-primary hover:text-teal">
                  {business.contacts.phone}
                </a>
              </div>
            )}
            {business.contacts.email && (
              <div className="flex items-center gap-2 text-text-secondary">
                <svg className="w-5 h-5 text-teal" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href={`mailto:${business.contacts.email}`} className="text-text-primary hover:text-teal">
                  {business.contacts.email}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-cream my-6"></div>

        {/* Description */}
        {business.short_description && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-3">About</h2>
            <p className="text-text-secondary leading-relaxed">
              {business.short_description}
            </p>
          </div>
        )}

        {/* Social Media Links */}
        {(business.contacts?.social_instagram || business.contacts?.social_facebook) && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-3">Follow Us</h2>
            <div className="flex gap-3">
              {business.contacts.social_instagram && (
                <a
                  href={business.contacts.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {business.contacts.social_facebook && (
                <a
                  href={business.contacts.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Buttons */}
      <div className="sticky bottom-0 bg-white border-t border-cream p-4 shadow-lg">
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
          {business.contacts?.phone && (
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

        <div className="grid grid-cols-3 gap-3">
          {/* Email Button */}
          {business.contacts?.email && (
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-teal text-white rounded-xl font-semibold shadow-md hover:bg-[#0E5A50] active:scale-98 transition-all min-h-[48px]"
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
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange text-white rounded-xl font-semibold shadow-md hover:bg-[#8F4814] active:scale-98 transition-all min-h-[48px]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
              Website
            </button>
          )}

          {/* Directions Button */}
          {business.location && (
            <button
              onClick={handleDirections}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gold text-text-primary rounded-xl font-semibold shadow-md hover:bg-gold active:scale-98 transition-all min-h-[48px]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Directions
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
