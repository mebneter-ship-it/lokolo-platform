'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface PlatformAnalytics {
  total_events: number
  total_page_views: number
  total_contact_clicks: number
  top_businesses: { business_id: string; business_name: string; views: number }[]
  events_by_day: { date: string; count: number }[]
}

interface EventBreakdown {
  event_type: string
  count: number
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([])
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [days, setDays] = useState(30)
  const [exporting, setExporting] = useState(false)
  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      checkAdminAndFetch()
    }
  }, [user, authLoading, days])

  const checkAdminAndFetch = async () => {
    try {
      setLoading(true)
      const token = await user!.getIdToken()

      // Check admin role
      const meRes = await fetch(`${API}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const meData = await meRes.json()
      setUserRole(meData.data?.role)

      if (meData.data?.role !== 'admin') {
        setLoading(false)
        return
      }

      // Fetch platform analytics
      const analyticsRes = await fetch(`${API}/api/v1/analytics/platform?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data.data)
      }

      // Fetch event breakdown (custom query via a simple endpoint or we calculate from raw)
      // For now, let's fetch raw recent events to show breakdown
      const eventsRes = await fetch(`${API}/api/v1/analytics/admin/events?limit=500&days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        const events = eventsData.data?.events || []
        setRecentEvents(events.slice(0, 20))
        
        // Calculate breakdown
        const breakdown: Record<string, number> = {}
        events.forEach((e: any) => {
          breakdown[e.event_type] = (breakdown[e.event_type] || 0) + 1
        })
        setEventBreakdown(
          Object.entries(breakdown)
            .map(([event_type, count]) => ({ event_type, count }))
            .sort((a, b) => b.count - a.count)
        )
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const exportToExcel = async () => {
    setExporting(true)
    try {
      const token = await user!.getIdToken()
      
      // Fetch all events
      const eventsRes = await fetch(`${API}/api/v1/analytics/admin/events?limit=5000&days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!eventsRes.ok) throw new Error('Failed to fetch events')
      
      const eventsData = await eventsRes.json()
      const events = eventsData.data?.events || []
      
      // Create CSV content
      const headers = ['Date', 'Time', 'Event Type', 'Business Name', 'Business ID', 'User Email', 'User ID', 'Session ID']
      const rows = events.map((e: any) => {
        const date = new Date(e.created_at)
        return [
          date.toLocaleDateString('en-ZA'),
          date.toLocaleTimeString('en-ZA'),
          e.event_type,
          e.business_name || '',
          e.business_id || '',
          e.user_email || '',
          e.user_id || '',
          e.session_id || '',
        ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      })
      
      const csv = [headers.join(','), ...rows].join('\n')
      
      // Add BOM for Excel UTF-8 compatibility
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
      
      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lokolo-analytics-${days}days-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'page_view': return '👁️'
      case 'contact_click_phone': return '📞'
      case 'contact_click_whatsapp': return '💬'
      case 'contact_click_website': return '🌐'
      case 'contact_click_email': return '✉️'
      case 'favorite_add': return '❤️'
      case 'favorite_remove': return '💔'
      case 'search_impression': return '🔍'
      case 'map_pin_click': return '📍'
      case 'share': return '📤'
      default: return '📊'
    }
  }

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'page_view': return 'Page Views'
      case 'contact_click_phone': return 'Phone Clicks'
      case 'contact_click_whatsapp': return 'WhatsApp Clicks'
      case 'contact_click_website': return 'Website Clicks'
      case 'contact_click_email': return 'Email Clicks'
      case 'favorite_add': return 'Favorites Added'
      case 'favorite_remove': return 'Favorites Removed'
      case 'search_impression': return 'Search Impressions'
      case 'map_pin_click': return 'Map Pin Clicks'
      case 'share': return 'Shares'
      default: return type
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Access Denied</h1>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/admin" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-white">Analytics Dashboard</h1>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        {/* Time Period Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-text-primary">Time Period:</span>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  days === d ? 'bg-gold text-text-primary' : 'bg-cream text-text-secondary'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-teal text-white font-semibold rounded-lg hover:bg-[#0E5A50] disabled:opacity-50 transition-colors"
          >
            {exporting ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </>
            )}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-text-secondary text-sm">Total Events</span>
            </div>
            <p className="text-3xl font-bold text-text-primary">{analytics?.total_events || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">👁️</span>
              <span className="text-text-secondary text-sm">Page Views</span>
            </div>
            <p className="text-3xl font-bold text-teal">{analytics?.total_page_views || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📞</span>
              <span className="text-text-secondary text-sm">Contact Clicks</span>
            </div>
            <p className="text-3xl font-bold text-orange">{analytics?.total_contact_clicks || 0}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📈</span>
              <span className="text-text-secondary text-sm">Conversion Rate</span>
            </div>
            <p className="text-3xl font-bold text-gold">
              {analytics?.total_page_views 
                ? ((analytics.total_contact_clicks / analytics.total_page_views) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Event Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-bold text-text-primary mb-4">Events by Type</h2>
            {eventBreakdown.length === 0 ? (
              <p className="text-text-secondary">No events tracked yet</p>
            ) : (
              <div className="space-y-3">
                {eventBreakdown.map((item) => (
                  <div key={item.event_type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getEventIcon(item.event_type)}</span>
                      <span className="text-text-primary">{getEventLabel(item.event_type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-cream rounded-full h-2">
                        <div
                          className="bg-gold rounded-full h-2"
                          style={{
                            width: `${Math.min(100, (item.count / (eventBreakdown[0]?.count || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-text-primary font-semibold w-12 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Businesses */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-bold text-text-primary mb-4">Top Businesses by Views</h2>
            {!analytics?.top_businesses || analytics.top_businesses.length === 0 ? (
              <p className="text-text-secondary">No data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.top_businesses.map((biz, index) => (
                  <div key={biz.business_id} className="flex items-center justify-between py-2 border-b border-cream last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        index === 0 ? 'bg-gold' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange' : 'bg-cream text-text-secondary'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-text-primary font-medium">{biz.business_name}</span>
                    </div>
                    <span className="text-teal font-semibold">{biz.views} views</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-text-primary mb-4">Recent Events</h2>
          {recentEvents.length === 0 ? (
            <p className="text-text-secondary">No events tracked yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream">
                    <th className="text-left py-2 px-2 text-text-secondary text-sm font-medium">Type</th>
                    <th className="text-left py-2 px-2 text-text-secondary text-sm font-medium">Business</th>
                    <th className="text-left py-2 px-2 text-text-secondary text-sm font-medium">User</th>
                    <th className="text-left py-2 px-2 text-text-secondary text-sm font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-cream/50 hover:bg-cream/30">
                      <td className="py-2 px-2">
                        <span className="flex items-center gap-2">
                          <span>{getEventIcon(event.event_type)}</span>
                          <span className="text-text-primary text-sm">{getEventLabel(event.event_type)}</span>
                        </span>
                      </td>
                      <td className="py-2 px-2 text-text-secondary text-sm">
                        {event.business_name || event.business_id?.substring(0, 8) || '-'}
                      </td>
                      <td className="py-2 px-2 text-text-secondary text-sm">
                        {event.user_email || (event.user_id ? event.user_id.substring(0, 8) : 'Anonymous')}
                      </td>
                      <td className="py-2 px-2 text-text-secondary text-sm">
                        {formatDate(event.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
