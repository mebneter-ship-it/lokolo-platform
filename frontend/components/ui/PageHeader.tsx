'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Lokolo Design System - Page Header Component
 * 
 * Usage:
 *   <PageHeader title="My Favorites" />
 *   <PageHeader title="Admin Dashboard" subtitle="Manage platform" backHref="/" rightContent={<UserEmail />} />
 *   <PageHeader title="Edit Business" showLogo={false} />
 */

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backHref?: string  // If provided, uses Link instead of router.back()
  onBack?: () => void  // Custom back handler
  showLogo?: boolean
  rightContent?: React.ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  showBack = true,
  backHref,
  onBack,
  showLogo = true,
  rightContent,
  className = '',
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  const BackButton = () => (
    <button
      onClick={handleBack}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
      aria-label="Go back"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  )

  const BackLink = () => (
    <Link
      href={backHref!}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
      aria-label="Go back"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </Link>
  )

  return (
    <header className={`sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md ${className}`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side: Back + Logo + Title */}
        <div className="flex items-center gap-3">
          {showBack && (backHref && !onBack ? <BackLink /> : <BackButton />)}
          
          {showLogo && (
            <img 
              src="/images/lokolo-logo.png" 
              alt="Lokolo" 
              className="w-10 h-10 rounded-lg"
            />
          )}
          
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/80">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side: Optional content */}
        {rightContent && (
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  )
}
