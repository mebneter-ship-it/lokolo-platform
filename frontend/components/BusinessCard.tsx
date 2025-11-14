'use client'

interface Business {
  id: string
  name: string
  short_description?: string
  category?: string
  distance?: number
  is_verified?: boolean
  is_featured?: boolean
  logo_url?: string
  isFavorite?: boolean
  hours?: any
}

interface BusinessCardProps {
  business: Business
  onClick: () => void
  onFavoriteToggle?: (businessId: string, isFavorite: boolean) => void
  isSelected?: boolean
}

export default function BusinessCard({ business, onClick, onFavoriteToggle, isSelected }: BusinessCardProps) {
  // Category gradient mapping
  const getCategoryGradient = (category?: string) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('coffee') || cat.includes('food') || cat.includes('restaurant')) {
      return 'linear-gradient(135deg, #F5A623 0%, #FDB750 100%)'
    } else if (cat.includes('fashion') || cat.includes('retail') || cat.includes('clothing')) {
      return 'linear-gradient(135deg, #B85C1A 0%, #D67B2C 100%)'
    } else {
      return 'linear-gradient(135deg, #156B60 0%, #1A8173 100%)'
    }
  }

  // Format distance
  const formatDistance = (distance?: number) => {
    if (!distance) return ''
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  // Get category emoji
  const getCategoryEmoji = (category?: string) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('coffee')) return '☕'
    if (cat.includes('food') || cat.includes('restaurant')) return '🍽️'
    if (cat.includes('fashion') || cat.includes('clothing')) return '👗'
    if (cat.includes('beauty') || cat.includes('salon')) return '💅'
    if (cat.includes('tech')) return '💻'
    return '🏪'
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (onFavoriteToggle) {
      onFavoriteToggle(business.id, !business.isFavorite)
    }
  }

  // FOR TESTING: Show all businesses as open
  // Remove this later when you have real hours data
  const isOpen = true

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
      {/* Favorite Heart Button */}
      {onFavoriteToggle && (
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
          aria-label={business.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {business.isFavorite ? (
            <span className="text-2xl">❤️</span>
          ) : (
            <span className="text-2xl text-text-secondary">🤍</span>
          )}
        </button>
      )}

      <div className="flex gap-4">
        {/* Business Image/Logo */}
        <div
          className="flex-shrink-0 w-24 h-24 rounded-lg flex items-center justify-center text-3xl"
          style={{
            background: business.logo_url ? 'transparent' : getCategoryGradient(business.category),
          }}
        >
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span>{getCategoryEmoji(business.category)}</span>
          )}
        </div>

        {/* Business Info */}
        <div className="flex-1 min-w-0 pr-12">
          {/* Name and Badge Row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-bold text-text-primary truncate">
              {business.name}
            </h3>
            
            {/* Badges */}
            <div className="flex-shrink-0 flex gap-1 flex-wrap">
              {/* TEST: Always show Open badge */}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white whitespace-nowrap">
                • Open
              </span>
              
              {business.is_verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-teal text-white whitespace-nowrap">
                  ✓ Verified
                </span>
              )}
              {business.is_featured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gold text-text-primary whitespace-nowrap">
                  ★ Featured
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
          <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
            {business.distance && (
              <span className="flex items-center gap-1">
                📍 {formatDistance(business.distance)}
              </span>
            )}
            {business.category && (
              <span className="flex items-center gap-1">
                {getCategoryEmoji(business.category)} {business.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
