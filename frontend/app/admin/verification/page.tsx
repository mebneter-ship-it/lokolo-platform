'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface VerificationRequest {
  id: string; business_name: string; requester_email: string
  status: 'pending' | 'approved' | 'rejected'; created_at: string; document_count?: number
}

export default function AdminVerificationListPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const API = process.env.NEXT_PUBLIC_API_URL

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const token = await user.getIdToken()
      
      const meRes = await fetch(`${API}/api/v1/me`, { headers: { Authorization: `Bearer ${token}` } })
      const meData = await meRes.json()
      setUserRole(meData.data?.role)
      if (meData.data?.role !== 'admin') { setLoading(false); return }

      const params = new URLSearchParams()
      if (filter) params.append('status', filter)
      const res = await fetch(`${API}/api/v1/admin/verification-requests?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok && data.data) setRequests(data.data.requests || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [user, filter, API])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    if (user) fetchData()
  }, [authLoading, user, router, fetchData])

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

  if (authLoading || loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (userRole !== 'admin') return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Access Denied</h1>
        <button onClick={() => router.push('/')} className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold">Go Home</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/admin" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold text-white">Verification Requests</h1>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-text-primary">Filter:</span>
          {[{v:'',l:'All'},{v:'pending',l:'Pending'},{v:'approved',l:'Approved'},{v:'rejected',l:'Rejected'}].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${filter === f.v 
                ? (f.v === 'approved' ? 'bg-teal text-white' : f.v === 'rejected' ? 'bg-red-500 text-white' : 'bg-gold text-text-primary') 
                : 'bg-cream text-text-secondary'}`}>
              {f.l}
            </button>
          ))}
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-text-secondary">No verification requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <Link key={r.id} href={`/admin/verification/${r.id}`} className="block bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-text-primary">{r.business_name}</h3>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        r.status === 'approved' ? 'bg-teal/10 text-teal' :
                        r.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gold/20 text-gold'
                      }`}>{r.status}</span>
                    </div>
                    <p className="text-text-secondary text-sm">{r.requester_email} • {fmtDate(r.created_at)}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg font-semibold text-sm ${r.status === 'pending' ? 'bg-gold text-text-primary' : 'bg-cream text-text-secondary'}`}>
                    {r.status === 'pending' ? 'Review →' : 'View →'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
