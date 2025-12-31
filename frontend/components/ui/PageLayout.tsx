'use client'

import PageHeader from './PageHeader'

/**
 * Lokolo Design System - Page Layout Component
 * 
 * Wraps pages with consistent header, background, and content area.
 * 
 * Usage:
 *   <PageLayout title="My Favorites">
 *     <YourContent />
 *   </PageLayout>
 * 
 *   <PageLayout 
 *     title="Admin Dashboard" 
 *     subtitle="Manage platform"
 *     backHref="/"
 *     maxWidth="6xl"
 *     rightContent={<span>{user?.email}</span>}
 *   >
 *     <YourContent />
 *   </PageLayout>
 */

interface PageLayoutProps {
  children: React.ReactNode
  
  // Header props
  title: string
  subtitle?: string
  showBack?: boolean
  backHref?: string
  onBack?: () => void
  showLogo?: boolean
  rightContent?: React.ReactNode
  
  // Layout props
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full'
  padding?: boolean
  className?: string
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full',
}

export default function PageLayout({
  children,
  title,
  subtitle,
  showBack = true,
  backHref,
  onBack,
  showLogo = true,
  rightContent,
  maxWidth = '2xl',
  padding = true,
  className = '',
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-cream">
      <PageHeader
        title={title}
        subtitle={subtitle}
        showBack={showBack}
        backHref={backHref}
        onBack={onBack}
        showLogo={showLogo}
        rightContent={rightContent}
      />
      
      <main className={`${maxWidthClasses[maxWidth]} mx-auto ${padding ? 'p-4' : ''} ${className}`}>
        {children}
      </main>
    </div>
  )
}
