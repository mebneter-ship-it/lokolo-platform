'use client'

import { useRef, useState, useEffect } from 'react'
import BusinessCard from './BusinessCard'

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

interface BottomSheetProps {
  businesses: Business[]
  selectedBusinessId: string | null
  onCardClick: (businessId: string) => void
  loading?: boolean
}

export default function BottomSheet({
  businesses,
  selectedBusinessId,
  onCardClick,
  loading = false,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentHeight, setCurrentHeight] = useState(40) // vh

  // Auto-scroll to selected business
  useEffect(() => {
    if (selectedBusinessId && sheetRef.current) {
      const cardElement = document.getElementById(`business-${selectedBusinessId}`)
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [selectedBusinessId])

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const deltaY = startY - e.touches[0].clientY
    const viewportHeight = window.innerHeight
    const deltaPercent = (deltaY / viewportHeight) * 100

    const newHeight = Math.min(Math.max(currentHeight + deltaPercent, 20), 80)
    setCurrentHeight(newHeight)
    setStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    // Snap to nearest position
    if (currentHeight < 30) {
      setCurrentHeight(20)
    } else if (currentHeight > 60) {
      setCurrentHeight(80)
    } else {
      setCurrentHeight(40)
    }
  }

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 bg-cream rounded-t-3xl shadow-2xl transition-all duration-300"
      style={{
        height: `${currentHeight}vh`,
        maxHeight: '80vh',
        boxShadow: '0 -4px 20px rgba(45, 24, 16, 0.15)',
      }}
    >
      {/* Drag Handle */}
      <div
        className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="w-12 h-1.5 rounded-full bg-disabled"
          style={{ width: '48px', height: '6px' }}
        />
      </div>

      {/* Content */}
      <div className="px-4 pb-4 h-full overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            Nearby businesses ({businesses.length})
          </h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-text-secondary">Finding businesses nearby...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && businesses.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-text-primary font-semibold mb-1">No businesses found</p>
              <p className="text-text-secondary text-sm">
                Try adjusting your location or filters
              </p>
            </div>
          </div>
        )}

        {/* Business Cards */}
        {!loading && businesses.length > 0 && (
          <div className="space-y-0">
            {businesses.map((business) => (
              <div key={business.id} id={`business-${business.id}`}>
                <BusinessCard
                  business={business}
                  onClick={() => onCardClick(business.id)}
                  isSelected={selectedBusinessId === business.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        /* Custom scrollbar for smooth scrolling */
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: #C4B5A6;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #8B7968;
        }
      `}</style>
    </div>
  )
}
