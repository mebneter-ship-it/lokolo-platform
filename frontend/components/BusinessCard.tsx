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
}

interface BusinessCardProps {
  business: Business
  onClick: () => void
  isSelected?: boolean
}

export default function BusinessCard({ business, onClick, isSelected }: BusinessCardProps) {
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
    if (distance < 1000) return `${Math.round(distance)}m`
    return `${(distance / 1000).toFixed(1)}km`
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

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl p-4 mb-3 shadow-sm transition-all cursor-pointer
        ${isSelected ? 'border-2 border-gold' : 'border-2 border-cream'}
        hover:border-gold hover:-translate-y-0.5 active:scale-99
      `}
      style={{ minHeight: '120px' }}
    >
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
        <div className="flex-1 min-w-0">
          {/* Name and Badge Row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-bold text-text-primary truncate">
              {business.name}
            </h3>
            
            {/* Badges */}
            <div className="flex-shrink-0">
              {business.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-teal text-white">
                  ✓ Verified
                </span>
              )}
              {business.featured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gold text-text-primary">
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
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            {business.distance && (
              <span className="flex items-center gap-1">
                📍 {formatDistance(business.distance)}
              </span>
            )}
            <span className="flex items-center gap-1">
              ⭐ 4.8
            </span>
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
