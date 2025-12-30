// VerifiedBadge.tsx - A badge component for verified Black-owned businesses
// Use: <VerifiedBadge size="sm" /> or <VerifiedBadge size="lg" showText />

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function VerifiedBadge({ size = 'md', showText = false, className = '' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const containerClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  }

  if (showText) {
    return (
      <div className={`inline-flex items-center ${containerClasses[size]} ${className}`}>
        <div className={`${sizeClasses[size]} flex-shrink-0`}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shield background */}
            <path 
              d="M12 2L13.09 8.26L20 9L14.14 13.14L16.18 20L12 16.77L7.82 20L9.86 13.14L4 9L10.91 8.26L12 2Z" 
              fill="#156B60"
            />
            {/* Checkmark */}
            <path 
              d="M9 12L11 14L15 10" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className={`font-medium text-teal ${textSizeClasses[size]}`}>
          Verified Black-Owned
        </span>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 ${className}`} title="Verified Black-Owned Business">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shield/Star background */}
        <path 
          d="M12 2L13.09 8.26L20 9L14.14 13.14L16.18 20L12 16.77L7.82 20L9.86 13.14L4 9L10.91 8.26L12 2Z" 
          fill="#156B60"
        />
        {/* Checkmark */}
        <path 
          d="M9 12L11 14L15 10" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// Alternative simpler circular badge
export function VerifiedBadgeCircle({ size = 'md', className = '' }: Omit<VerifiedBadgeProps, 'showText'>) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div 
      className={`${sizeClasses[size]} bg-teal rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      title="Verified Black-Owned Business"
    >
      <svg 
        className="w-3/5 h-3/5 text-white" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={3} 
          d="M5 13l4 4L19 7" 
        />
      </svg>
    </div>
  )
}
