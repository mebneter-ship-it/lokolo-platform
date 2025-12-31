'use client'

/**
 * Lokolo Design System - Card Component
 * 
 * Usage:
 *   <Card>Content here</Card>
 *   <Card hover>Hoverable card</Card>
 *   <Card padding="lg" className="mb-4">With extra padding</Card>
 */

interface CardProps {
  children: React.ReactNode
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  children,
  hover = false,
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-md border border-cream
        ${paddingClasses[padding]}
        ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
