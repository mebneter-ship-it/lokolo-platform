'use client'

interface Business {
  id: string
  name: string
  short_description?: string
  category?: string
  distance?: number
  verified?: boolean
  featured?: boolean
  logo_url?: string
  isFavorite?: boolean
  tagline?: string
  rating?: number
  total_ratings?: number
}

interface BusinessCardProps {
  business: Business
  onClick: () => void
  onFavoriteToggle?: (businessId: string, isFavorite: boolean) => void
  isSelected?: boolean
}

export default function BusinessCard({ business, onClick, onFavoriteToggle, isSelected }: BusinessCardProps) {
  // Category gradient mapping - check category, tagline, description, and name
  const getCategoryGradient = (business: Business) => {
    const searchText = `${business.category || ''} ${business.name || ''} ${business.tagline || ''} ${business.short_description || ''}`.toLowerCase()
    
    if (searchText.includes('coffee') || searchText.includes('food') || searchText.includes('restaurant') || searchText.includes('kitchen') || searchText.includes('cuisine') || searchText.includes('bakery')) {
      return 'linear-gradient(135deg, #F5A623 0%, #FDB750 100%)'
    } else if (searchText.includes('fashion') || searchText.includes('retail') || searchText.includes('clothing')) {
      return 'linear-gradient(135deg, #B85C1A 0%, #D67B2C 100%)'
    } else {
      return 'linear-gradient(135deg, #156B60 0%, #1A8173 100%)'
    }
  }

  // Format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return ''
    if (distance < 1000) return `${Math.round(distance)}m`
    return `${(distance / 1000).toFixed(1)}km`
  }

  // Get category emoji - check category, tagline, description, and name
  const getCategoryEmoji = (business: Business) => {
    const searchText = `${business.category || ''} ${business.name || ''} ${business.tagline || ''} ${business.short_description || ''}`.toLowerCase()
    
    if (searchText.includes('coffee')) return '☕'
    if (searchText.includes('bakery') || searchText.includes('bread')) return '🥐'
    if (searchText.includes('food') || searchText.includes('restaurant') || searchText.includes('kitchen') || searchText.includes('cuisine')) return '🍽️'
    if (searchText.includes('fashion') || searchText.includes('clothing')) return '👗'
    if (searchText.includes('beauty') || searchText.includes('salon')) return '💅'
    if (searchText.includes('tech')) return '💻'
    if (searchText.includes('bar') || searchText.includes('pub')) return '🍺'
    if (searchText.includes('gym') || searchText.includes('fitness')) return '💪'
    if (searchText.includes('book')) return '📚'
    return '🏪'
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (onFavoriteToggle) {
      onFavoriteToggle(business.id, !business.isFavorite)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl p-4 mb-3 shadow-sm transition-all cursor-pointer relative
        ${isSelected ? 'border-2 border-gold' : 'border-2 border-cream'}
        hover:border-gold hover:-translate-y-0.5 active:scale-99
      `}
      style={{ minHeight: '120px' }}
    >
      {/* Favorite Heart Button - Top Right */}
      {onFavoriteToggle && (
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
          aria-label={business.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span className="text-2xl">
            {business.isFavorite ? '❤️' : '🤍'}
          </span>
        </button>
      )}

      <div className="flex gap-4">
        {/* Business Image/Logo */}
        <div
          className="flex-shrink-0 w-24 h-24 rounded-lg flex items-center justify-center text-3xl"
          style={{
            background: business.logo_url ? 'transparent' : getCategoryGradient(business),
          }}
        >
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span>{getCategoryEmoji(business)}</span>
          )}
        </div>

        {/* Business Info */}
        <div className="flex-1 min-w-0 pr-8">
          {/* Name and Badge Row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-bold text-text-primary truncate">
              {business.name}
            </h3>
            
            {/* Badges */}
            <div className="flex-shrink-0 flex gap-1">
              {business.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-teal text-white">
                  ✓
                </span>
              )}
              {business.featured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gold text-text-primary">
                  ★
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {business.short_description && (
            <p className="text-sm text-text-secondary line-clamp-2 mb-2 leading-relaxed">
              {business.short_description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            {business.distance && (
              <span className="flex items-center gap-1">
                📍 {formatDistance(business.distance)}
              </span>
            )}
            <span className="flex items-center gap-1">
              ⭐ {business.rating && business.rating > 0 ? business.rating.toFixed(1) : '—'}
              {business.total_ratings !== undefined && business.total_ratings > 0 && (
                <span className="text-text-secondary/70">({business.total_ratings})</span>
              )}
            </span>
            {(business.category || business.tagline) && (
              <span className="flex items-center gap-1">
                {getCategoryEmoji(business)} {business.category || business.tagline}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
