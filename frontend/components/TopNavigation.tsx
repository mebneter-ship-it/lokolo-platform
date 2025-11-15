'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

interface TopNavigationProps {
  onSearch: (query: string) => void
  onFilterChange: (filters: FilterState) => void
  onRadiusChange: (radius: number) => void
  currentRadius: number
}

interface FilterState {
  verified_only?: boolean
  open_now?: boolean
  featured_only?: boolean
}

export default function TopNavigation({ onSearch, onFilterChange, onRadiusChange, currentRadius }: TopNavigationProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['nearby']))
  const [showFilters, setShowFilters] = useState(false)

  // Debounced search - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        onSearch(searchQuery.trim())
      } else {
        onSearch('')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearch])

  // Update filters when active filters change
  useEffect(() => {
    const filters: FilterState = {
      verified_only: activeFilters.has('verified'),
      open_now: activeFilters.has('open'),
      featured_only: activeFilters.has('featured'),
    }
    onFilterChange(filters)
  }, [activeFilters, onFilterChange])

  const toggleFilter = (filterId: string) => {
    const newFilters = new Set(activeFilters)
    
    // 'nearby' is always on, can't be turned off
    if (filterId === 'nearby') return
    
    if (newFilters.has(filterId)) {
      newFilters.delete(filterId)
    } else {
      newFilters.add(filterId)
    }
    
    setActiveFilters(newFilters)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const filters = [
    { id: 'nearby', label: 'Nearby', permanent: true },
    { id: 'verified', label: 'Verified' },
    { id: 'open', label: 'Open Now' },
    { id: 'featured', label: 'Featured' },
  ]

  const radiusOptions = [
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
    { value: 100, label: '100 km' },
  ]

  return (
    <header
      className="sticky top-0 z-50 shadow-md"
      style={{
        background: 'linear-gradient(135deg, #B85C1A 0%, #D67B2C 100%)',
      }}
    >
      {/* Main Navigation Bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo - 80x80px */}
        <div className="flex-shrink-0">
          <Image
            src="/images/lokolo-logo.png"
            alt="Lokolo"
            width={80}
            height={80}
            className="w-20 h-20 object-contain"
            priority
          />
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 px-4 pr-12 text-base rounded-full bg-white text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-gold"
            style={{ fontSize: '16px' }} // Prevents iOS zoom
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Button with Lokolo Icon */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gold flex items-center justify-center hover:bg-[#FDB750] active:scale-95 transition-all relative"
          aria-label="Filters"
        >
          {/* Mini Lokolo Pin Icon */}
          <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
            {/* Gold pin body */}
            <path
              d="M12 2C7.58 2 4 5.58 4 10C4 15 12 22 12 22C12 22 20 15 20 10C20 5.58 16.42 2 12 2Z"
              fill="#B85C1A"
            />
            {/* Teal center */}
            <circle cx="12" cy="10" r="4" fill="#156B60" />
          </svg>
          
          {/* Badge showing active filter count */}
          {activeFilters.size > 1 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeFilters.size - 1}
            </span>
          )}
        </button>

        {/* Login or Logout - FAR RIGHT */}
        {user ? (
          <button
            onClick={handleLogout}
            className="flex-shrink-0 px-4 py-2 rounded-full bg-white/20 text-white font-semibold hover:bg-white/30 active:scale-95 transition-all whitespace-nowrap"
          >
            Log Out
          </button>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="flex-shrink-0 px-4 py-2 rounded-full bg-gold text-text-primary font-semibold hover:bg-[#FDB750] active:scale-95 transition-all whitespace-nowrap"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Quick Filters + Radius Selector */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {/* Filter Buttons */}
        {filters.map((filter) => {
          const isActive = activeFilters.has(filter.id)
          return (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={`
                flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all
                ${
                  isActive
                    ? 'bg-gold text-text-primary shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }
                ${filter.permanent ? 'cursor-default' : 'cursor-pointer'}
              `}
              style={{ fontSize: '14px' }}
              disabled={filter.permanent}
            >
              {filter.label}
              {isActive && !filter.permanent && (
                <span className="ml-1.5">✓</span>
              )}
            </button>
          )
        })}

        {/* Radius Selector - After filters */}
        <select
          value={currentRadius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="flex-shrink-0 px-3 py-2 rounded-full text-sm font-semibold bg-gold text-text-primary shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
          style={{ fontSize: '14px' }}
        >
          {radiusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Modal/Dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-cream p-4 z-50">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-text-primary mb-3">Filters</h3>
            
            <div className="space-y-3">
              {filters.slice(1).map((filter) => (
                <label
                  key={filter.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.has(filter.id)}
                    onChange={() => toggleFilter(filter.id)}
                    className="w-5 h-5 rounded border-2 border-text-secondary checked:bg-gold checked:border-gold"
                  />
                  <span className="text-text-primary">{filter.label}</span>
                </label>
              ))}
            </div>
            
            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-4 py-3 bg-gold text-text-primary rounded-xl font-semibold hover:bg-[#FDB750] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  )
}
