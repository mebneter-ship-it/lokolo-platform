'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface VerificationDocument {
  id: string
  document_type: string
  original_filename: string
  created_at: string
}

interface VerificationRequest {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  reviewed_at?: string
  documents: VerificationDocument[] | null
}

interface Business {
  id: string
  name: string
  verification_status: 'pending' | 'approved' | 'rejected'
}

const DOCUMENT_TYPES = [
  { value: 'id_document', label: 'National ID / Passport', description: 'Government-issued identification' },
  { value: 'business_registration', label: 'Business Registration (CIPC)', description: 'Company registration certificate' },
  { value: 'bee_certificate', label: 'BEE Certificate', description: 'Black Economic Empowerment certificate' },
  { value: 'share_certificate', label: 'Share Certificate', description: 'Proof of ownership shares' },
  { value: 'other', label: 'Other Supporting Document', description: 'Any other relevant documentation' },
]

export default function SupplierVerificationPage() {
  const router = useRouter()
  const params = useParams()
  const businessId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [business, setBusiness] = useState<Business | null>(null)
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [selectedDocType, setSelectedDocType] = useState('id_document')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user && businessId) {
      fetchVerificationStatus()
    }
  }, [user, authLoading, businessId])

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true)
      const token = await user!.getIdToken()
      
      // Get business details
      const bizResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (!bizResponse.ok) {
        setError('Business not found or not authorized')
        return
      }
      
      const bizData = await bizResponse.json()
      setBusiness(bizData.data)

      // Get verification status
      const verResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}/verification`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      if (verResponse.ok) {
        const verData = await verResponse.json()
        setVerificationRequest(verData.data.verification_request)
      }
    } catch (err) {
      console.error('Failed to fetch verification status:', err)
      setError('Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    
    if (file.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed')
      return
    }

    setUploading(true)
    setError('')

    try {
      const token = await user!.getIdToken()

      // Get upload URL
      const urlResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}/verification/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: selectedDocType,
          filename: file.name,
          content_type: file.type,
          file_size: file.size,
        }),
      })

      if (!urlResponse.ok) {
        const errData = await urlResponse.json()
        throw new Error(errData.error || 'Failed to get upload URL')
      }

      const { data } = await urlResponse.json()

      // Upload file to Cloud Storage
      await fetch(data.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      setSuccess('Document uploaded successfully')
      fetchVerificationStatus()
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Delete this document?')) return

    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/verification/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        fetchVerificationStatus()
      } else {
        const errData = await response.json()
        setError(errData.error || 'Failed to delete document')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete document')
    }
  }

  const handleSubmitVerification = async () => {
    if (!verificationRequest?.documents || verificationRequest.documents.length === 0) {
      setError('Please upload at least one document before submitting')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const token = await user!.getIdToken()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}/verification/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        setSuccess('Verification request submitted! We will review your documents and get back to you.')
        fetchVerificationStatus()
      } else {
        const errData = await response.json()
        setError(errData.error || 'Failed to submit verification')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to submit verification request')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !business) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Error</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link href="/supplier/dashboard" className="px-6 py-3 bg-gold text-text-primary rounded-xl font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isVerified = business?.verification_status === 'approved'
  const isRejected = business?.verification_status === 'rejected'
  const isPending = verificationRequest?.status === 'pending' && verificationRequest?.documents && verificationRequest.documents.length > 0

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange to-gold shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link href="/supplier/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <img src="/images/lokolo-logo.png" alt="Lokolo" className="w-10 h-10 rounded-lg" />
            <h1 className="text-xl font-bold text-white">Ownership Verification</h1>
            <p className="text-white/80 text-sm">{business?.name}</p>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-500">×</button>
          </div>
        )}

        {/* Verified Status Card */}
        {isVerified && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-teal" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L20 9L14.14 13.14L16.18 20L12 16.77L7.82 20L9.86 13.14L4 9L10.91 8.26L12 2Z"/>
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-teal">Verified Black-Owned</h2>
                <p className="text-text-secondary">Your business ownership has been verified</p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected Status Card */}
        {isRejected && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-red-500">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-600">Verification Rejected</h2>
                <p className="text-text-secondary mt-1">
                  Unfortunately, your verification request was not approved.
                </p>
                {verificationRequest?.notes && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-700">Reason:</p>
                    <p className="text-sm text-red-600">{verificationRequest.notes}</p>
                  </div>
                )}
                <p className="text-sm text-text-secondary mt-3">
                  You can submit a new verification request with additional documentation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Status Card */}
        {isPending && !isVerified && !isRejected && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-gold">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gold animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Verification Pending</h2>
                <p className="text-text-secondary">Your documents are being reviewed by our team</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section - Only show if not verified and not pending review */}
        {!isVerified && !isPending && (
          <>
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-text-primary mb-2">Get Verified</h2>
              <p className="text-text-secondary mb-4">
                Upload documents to prove Black ownership of your business. Once verified, 
                your business will display a verified badge, building trust with customers.
              </p>
              
              <div className="bg-cream rounded-xl p-4">
                <h3 className="font-semibold text-text-primary mb-2">Accepted Documents:</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• National ID or Passport</li>
                  <li>• CIPC Business Registration</li>
                  <li>• BEE Certificate</li>
                  <li>• Share Certificates</li>
                  <li>• Other supporting documents</li>
                </ul>
              </div>
            </div>

            {/* Uploaded Documents */}
            {verificationRequest?.documents && verificationRequest.documents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="font-bold text-text-primary mb-4">Uploaded Documents</h3>
                <div className="space-y-3">
                  {verificationRequest.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-cream rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{doc.original_filename}</p>
                          <p className="text-xs text-text-secondary">
                            {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-text-primary mb-4">Upload Document</h3>
              
              {/* Document Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-4 border-2 border-dashed border-cream rounded-xl text-text-secondary hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Click to upload (PDF, JPG, PNG - Max 10MB)</span>
                  </div>
                )}
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitVerification}
              disabled={submitting || !verificationRequest?.documents || verificationRequest.documents.length === 0}
              className="w-full py-4 bg-teal text-white font-bold rounded-xl shadow-md hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit for Verification'
              )}
            </button>

            {(!verificationRequest?.documents || verificationRequest.documents.length === 0) && (
              <p className="text-center text-sm text-text-secondary mt-2">
                Upload at least one document to submit
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
