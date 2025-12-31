'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

type DocumentType = 'id_document' | 'business_registration' | 'ownership_proof' | 'bbbee_certificate' | 'other'

interface VerificationDocument {
  id: string; document_type: DocumentType; file_name: string
  file_size_bytes?: number; mime_type?: string; download_url?: string
}

interface VerificationRequest {
  id: string; status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string; created_at: string; documents: VerificationDocument[]
}

const DOC_TYPES: Record<DocumentType, { label: string; desc: string }> = {
  id_document: { label: 'National ID / Passport', desc: 'SA ID or passport of owner' },
  business_registration: { label: 'CIPC Registration', desc: 'Company registration from CIPC' },
  ownership_proof: { label: 'Ownership Proof', desc: 'Share certificates or proof' },
  bbbee_certificate: { label: 'B-BBEE Certificate', desc: 'BEE certificate' },
  other: { label: 'Other Document', desc: 'Other supporting docs' },
}

export default function SupplierVerificationPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params.id as string
  const { user, loading: authLoading } = useAuth()

  const [request, setRequest] = useState<VerificationRequest | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType>('id_document')

  const API = process.env.NEXT_PUBLIC_API_URL

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const token = await user.getIdToken()
      
      const [verRes, bizRes] = await Promise.all([
        fetch(`${API}/api/v1/supplier/businesses/${businessId}/verification`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/v1/supplier/businesses/${businessId}`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      const verData = await verRes.json()
      const bizData = await bizRes.json()
      
      if (verRes.ok && verData.data) setRequest(verData.data)
      if (bizData.data?.name) setBusinessName(bizData.data.name)
    } catch (e) { setError('Failed to load') }
    finally { setLoading(false) }
  }, [user, businessId, API])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    if (user) fetchData()
  }, [user, authLoading, router, fetchData])

  const createRequest = async () => {
    try {
      setError(''); setSuccess('')
      const token = await user!.getIdToken()
      const res = await fetch(`${API}/api/v1/supplier/businesses/${businessId}/verification`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}'
      })
      if (res.ok) { setSuccess('Request created. Upload documents now.'); fetchData() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch (e) { setError('Failed to create request') }
  }

  const uploadDoc = async () => {
    if (!selectedFile) return setError('Select a file')
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) return setError('Invalid file type')
    if (selectedFile.size > 10 * 1024 * 1024) return setError('Max 10MB')

    try {
      setUploading(true); setError(''); setSuccess('')
      const token = await user!.getIdToken()

      const urlRes = await fetch(`${API}/api/v1/supplier/businesses/${businessId}/verification/documents/upload-url`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: docType, file_name: selectedFile.name, content_type: selectedFile.type })
      })
      if (!urlRes.ok) { const d = await urlRes.json(); return setError(d.error || 'Failed to get URL') }
      const { data: { upload_url, storage_path } } = await urlRes.json()

      const uploadRes = await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': selectedFile.type }, body: selectedFile })
      if (!uploadRes.ok) return setError('Upload failed')

      const saveRes = await fetch(`${API}/api/v1/supplier/businesses/${businessId}/verification/documents`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: docType, storage_path, file_name: selectedFile.name, file_size_bytes: selectedFile.size, mime_type: selectedFile.type })
      })
      if (saveRes.ok) {
        setSuccess('Uploaded!'); setSelectedFile(null)
        const inp = document.getElementById('file-input') as HTMLInputElement; if (inp) inp.value = ''
        fetchData()
      } else { const d = await saveRes.json(); setError(d.error || 'Save failed') }
    } catch (e) { setError('Upload failed') }
    finally { setUploading(false) }
  }

  const deleteDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    try {
      const token = await user!.getIdToken()
      const res = await fetch(`${API}/api/v1/supplier/businesses/${businessId}/verification/documents/${docId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok || res.status === 204) { setSuccess('Deleted'); fetchData() }
    } catch (e) { setError('Delete failed') }
  }

  const fmtSize = (b?: number) => !b ? '' : b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(1)}KB` : `${(b/1048576).toFixed(1)}MB`

  if (authLoading || loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/supplier/dashboard" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <img src="/images/lokolo-logo.png" alt="Lokolo" className="w-10 h-10 rounded-lg" />
          <div><h1 className="text-xl font-bold text-white">Ownership Verification</h1>
<p className="text-sm text-white/80">{businessName}</p></div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {error && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4"><p className="text-red-600 text-sm font-semibold">{error}</p></div>}
        {success && <div className="bg-teal/10 border-2 border-teal rounded-xl p-4 mb-4"><p className="text-teal text-sm font-semibold">✓ {success}</p></div>}

        {!request ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Get Your Business Verified</h2>
            <p className="text-text-secondary mb-6">Verify Black ownership to earn a trusted badge on your listing.</p>
            <div className="bg-cream rounded-xl p-4 mb-6 text-left">
              <p className="font-semibold text-text-primary mb-2">Recommended documents (upload 1-5):</p>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• National ID or Passport</li>
                <li>• CIPC Registration</li>
                <li>• B-BBEE Certificate or Share Certificates</li>
              </ul>
              <p className="text-xs text-text-secondary mt-2 italic">You can upload any combination of documents. More documents = faster verification.</p>
            </div>
            <button onClick={createRequest} className="px-8 py-4 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold">
              Start Verification
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Status</h2>
                <span className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${
                  request.status === 'approved' ? 'bg-teal/10 text-teal' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gold/20 text-gold'
                }`}>{request.status}</span>
              </div>
              {request.status === 'rejected' && request.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 font-semibold text-sm">Rejection Reason:</p>
                  <p className="text-red-600 text-sm">{request.rejection_reason}</p>
                </div>
              )}
              {request.status === 'approved' && (
                <div className="bg-teal/10 border border-teal rounded-xl p-4 flex items-center gap-3">
                  <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <p className="text-teal font-bold">Verified Black-Owned Business ✓</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Documents ({request.documents?.length || 0}/5)</h3>
              {request.documents?.length ? (
                <div className="space-y-3">
                  {request.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between bg-cream rounded-xl p-4">
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{DOC_TYPES[doc.document_type]?.label || doc.document_type}</p>
                        <p className="text-text-secondary text-xs">{doc.file_name} • {fmtSize(doc.file_size_bytes)}</p>
                      </div>
                      {request.status === 'pending' && (
                        <button onClick={() => deleteDoc(doc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-text-secondary text-sm">No documents uploaded yet.</p>}
            </div>

            {request.status === 'pending' && (request.documents?.length || 0) < 5 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Upload Document</h3>
                <select value={docType} onChange={e => setDocType(e.target.value as DocumentType)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none mb-4" style={{fontSize:'16px'}}>
                  {Object.entries(DOC_TYPES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input id="file-input" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => { setSelectedFile(e.target.files?.[0] || null); setError('') }}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream mb-4" />
                {selectedFile && <div className="bg-cream rounded-xl p-3 mb-4 text-sm">{selectedFile.name} ({fmtSize(selectedFile.size)})</div>}
                <button onClick={uploadDoc} disabled={!selectedFile || uploading}
                  className="w-full py-4 bg-gold text-text-primary font-bold rounded-xl disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
