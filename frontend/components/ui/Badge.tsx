'use client'

/**
 * Lokolo Design System - Badge Component
 * 
 * Usage:
 *   <Badge status="active">Active</Badge>
 *   <Badge status="pending">Pending</Badge>
 *   <Badge status="verified">✓ Verified</Badge>
 */

type BadgeStatus = 'active' | 'pending' | 'draft' | 'rejected' | 'verified' | 'featured' | 'unverified'

interface BadgeProps {
  children: React.ReactNode
  status?: BadgeStatus
  className?: string
}

const statusClasses: Record<BadgeStatus, string> = {
  active: 'bg-teal/10 text-teal',
  pending: 'bg-gold/10 text-gold',
  draft: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-600',
  verified: 'bg-teal text-white',
  featured: 'bg-gold text-text-primary',
  unverified: 'bg-cream text-text-secondary',
}

export default function Badge({
  children,
  status = 'active',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        px-3 py-1 rounded-full text-xs font-semibold
        ${statusClasses[status]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
