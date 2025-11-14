// Business hours utilities

export interface BusinessHours {
  hours_json?: {
    monday?: Array<{ open: string; close: string }>
    tuesday?: Array<{ open: string; close: string }>
    wednesday?: Array<{ open: string; close: string }>
    thursday?: Array<{ open: string; close: string }>
    friday?: Array<{ open: string; close: string }>
    saturday?: Array<{ open: string; close: string }>
    sunday?: Array<{ open: string; close: string }>
  }
}

/**
 * Check if a business is currently open
 */
export function isBusinessOpen(hours?: BusinessHours['hours_json']): boolean {
  if (!hours) return false

  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const currentDay = dayNames[now.getDay()] as keyof typeof hours
  const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight

  const todayHours = hours[currentDay]
  if (!todayHours || todayHours.length === 0) return false

  // Check if current time falls within any of today's open periods
  return todayHours.some(period => {
    const [openHour, openMin] = period.open.split(':').map(Number)
    const [closeHour, closeMin] = period.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin

    return currentTime >= openTime && currentTime < closeTime
  })
}

/**
 * Format hours for display (e.g., "9:00 AM - 5:00 PM")
 */
export function formatTimeRange(open: string, close: string): string {
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  return `${formatTime(open)} - ${formatTime(close)}`
}

/**
 * Get display text for current day's hours
 */
export function getTodayHoursText(hours?: BusinessHours['hours_json']): string {
  if (!hours) return 'Hours not available'

  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const currentDay = dayNames[now.getDay()] as keyof typeof hours

  const todayHours = hours[currentDay]
  if (!todayHours || todayHours.length === 0) return 'Closed today'

  if (todayHours.length === 1) {
    return formatTimeRange(todayHours[0].open, todayHours[0].close)
  }

  // Multiple periods (e.g., lunch break)
  return todayHours.map(p => formatTimeRange(p.open, p.close)).join(', ')
}

/**
 * Get all hours formatted for display
 */
export function formatAllHours(hours?: BusinessHours['hours_json']): Array<{ day: string; hours: string }> {
  if (!hours) return []

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]

  return days.map(({ key, label }) => {
    const dayHours = hours[key as keyof typeof hours]
    
    if (!dayHours || dayHours.length === 0) {
      return { day: label, hours: 'Closed' }
    }

    if (dayHours.length === 1) {
      return { day: label, hours: formatTimeRange(dayHours[0].open, dayHours[0].close) }
    }

    // Multiple periods
    return { 
      day: label, 
      hours: dayHours.map(p => formatTimeRange(p.open, p.close)).join(', ')
    }
  })
}

/**
 * Get closing time text (e.g., "Closes at 9:00 PM" or "Closes soon")
 */
export function getClosingTimeText(hours?: BusinessHours['hours_json']): string | null {
  if (!hours) return null

  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const currentDay = dayNames[now.getDay()] as keyof typeof hours
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const todayHours = hours[currentDay]
  if (!todayHours || todayHours.length === 0) return null

  // Find the current open period
  for (const period of todayHours) {
    const [openHour, openMin] = period.open.split(':').map(Number)
    const [closeHour, closeMin] = period.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin

    if (currentTime >= openTime && currentTime < closeTime) {
      // Currently open - check if closing soon (within 1 hour)
      const timeUntilClose = closeTime - currentTime
      
      if (timeUntilClose <= 60) {
        return 'Closes soon'
      }

      const [hour, minute] = period.close.split(':').map(Number)
      const period12h = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `Closes at ${displayHour}:${minute.toString().padStart(2, '0')} ${period12h}`
    }
  }

  return null
}
