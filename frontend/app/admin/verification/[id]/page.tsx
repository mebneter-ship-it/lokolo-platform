'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

type DocType = 'id_document' | 'business_registration' | 'ownership_proof' | 'bbbee_certificate' | 'other'

interface Doc { id: string; document_type: DocType; file_name: string; mime_type?: string; url?: string }
interface Request {
  id: string; business_name: string; requester_email: string
  status: 'pending' | 'approved' | 'rejected'; created_at: string
  documents: Doc[]; business?: { id: string }
}

const LABELS: Record<DocType, string> = {
  id_document: 'ID / Passport', business_registration: 'CIPC', ownership_proof: 'Ownership', bbbee_certificate: 'B-BBEE', other: 'Other'
}

export default function AdminVerificationReviewPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [viewDoc, setViewDoc] = useState<Doc | null>(null)
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

      const res = await fetch(`${API}/api/v1/admin/verification-requests/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok && data.data) setRequest(data.data)
      else setError(data.error || 'Not found')
    } catch (e) { setError('Failed to load') }
    finally { setLoading(false) }
  }, [user, params.id, API])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    if (user) fetchData()
  }, [authLoading, user, router, fetchData])

  const review = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reason.trim()) return setError('Provide rejection reason')
    try {
      setSubmitting(true); setError('')
      const token = await user!.getIdToken()
      const res = await fetch(`${API}/api/v1/admin/verification-requests/${params.id}/review`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, review_notes: notes || undefined, rejection_reason: status === 'rejected' ? reason : undefined })
      })
      if (res.ok) { setSuccess(status === 'approved' ? 'Approved!' : 'Rejected'); setShowReject(false); fetchData() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch (e) { setError('Failed') }
    finally { setSubmitting(false) }
  }

  if (authLoading || loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" /></div>
  if (userRole !== 'admin' || !request) return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center">
        <p className="text-text-primary mb-4">{error || 'Access denied'}</p>
        <Link href="/admin/verification" className="text-orange font-semibold">← Back</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/admin/verification" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div><h1 className="text-xl font-bold text-white">Review</h1><p className="text-sm text-white/80">{request.business_name}</p></div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4"><p className="text-red-600 text-sm">{error}</p></div>}
        {success && <div className="bg-teal/10 border-2 border-teal rounded-xl p-4 mb-4"><p className="text-teal text-sm">✓ {success}</p></div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-text-primary">Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                  request.status === 'approved' ? 'bg-teal/10 text-teal' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gold/20 text-gold'
                }`}>{request.status}</span>
              </div>
              <p className="text-text-secondary text-sm">{request.business_name}</p>
              <p className="text-text-secondary text-sm">{request.requester_email}</p>
            </div>
            {request.status === 'pending' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="font-bold text-text-primary mb-3">Notes</h2>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none resize-none" rows={3} style={{fontSize:'16px'}} />
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-bold text-text-primary mb-4">Documents ({request.documents?.length || 0})</h2>
              {request.documents?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {request.documents.map(doc => (
                    <div key={doc.id} onClick={() => setViewDoc(doc)} className="bg-cream rounded-xl p-4 cursor-pointer hover:bg-gold/20 transition-colors">
                      <p className="font-semibold text-text-primary text-sm">{LABELS[doc.document_type] || doc.document_type}</p>
                      <p className="text-text-secondary text-xs truncate">{doc.file_name}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-text-secondary text-center py-8">No documents</p>}

              {request.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-cream">
                  <button onClick={() => review('approved')} disabled={submitting} className="flex-1 py-4 bg-teal text-white font-bold rounded-xl disabled:opacity-50">
                    {submitting ? '...' : '✓ Approve'}
                  </button>
                  <button onClick={() => setShowReject(true)} disabled={submitting} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50">
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {viewDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <p className="font-bold">{LABELS[viewDoc.document_type]}</p>
              <div className="flex gap-2">
                <a href={viewDoc.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gold rounded-lg font-semibold text-sm">Open</a>
                <button onClick={() => setViewDoc(null)} className="p-2 hover:bg-cream rounded-lg">✕</button>
              </div>
            </div>
            <div className="p-4 overflow-auto" style={{maxHeight:'calc(90vh - 70px)'}}>
              {viewDoc.mime_type === 'application/pdf' 
                ? <iframe src={viewDoc.url} className="w-full h-[70vh] rounded-lg" />
                : <img src={viewDoc.url} alt={viewDoc.file_name} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />}
            </div>
          </div>
        </div>
      )}

      {showReject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Reject Verification</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (will be shown to owner)..."
              className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-red-500 focus:outline-none mb-4 resize-none" rows={4} style={{fontSize:'16px'}} autoFocus />
            <div className="flex gap-4">
              <button onClick={() => { setShowReject(false); setReason('') }} className="flex-1 py-3 border-2 border-cream rounded-xl">Cancel</button>
              <button onClick={() => review('rejected')} disabled={submitting || !reason.trim()} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50">
                {submitting ? '...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
