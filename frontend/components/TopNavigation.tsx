'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function TopNavigation() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('nearby')

  const filters = [
    { id: 'nearby', label: 'Nearby' },
    { id: 'verified', label: 'Verified Only' },
    { id: 'open', label: 'Open Now' },
    { id: 'featured', label: 'Featured' },
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
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 px-4 text-base rounded-full bg-white text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-gold"
            style={{ fontSize: '16px' }} // Prevents iOS zoom
          />
        </div>

        {/* Filter Button */}
        <button
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gold flex items-center justify-center hover:bg-light-gold active:scale-95 transition-all"
          aria-label="Filters"
        >
          <span className="text-xl">⚙️</span>
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${
                activeFilter === filter.id
                  ? 'bg-gold text-text-primary'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }
            `}
            style={{ fontSize: '14px' }}
          >
            {filter.label}
          </button>
        ))}
      </div>

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
