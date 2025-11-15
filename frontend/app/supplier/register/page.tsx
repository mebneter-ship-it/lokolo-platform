'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import Step1BusinessBasics from '@/components/supplier/Step1BusinessBasics'
import Step2ContactInfo from '@/components/supplier/Step2ContactInfo'
import Step3Location from '@/components/supplier/Step3Location'
import Step4Photos from '@/components/supplier/Step4Photos'
import Step5BusinessHours from '@/components/supplier/Step5BusinessHours'

// Form steps
const STEPS = [
  { id: 1, title: 'Business Basics', icon: '🏪' },
  { id: 2, title: 'Contact Info', icon: '📞' },
  { id: 3, title: 'Location', icon: '📍' },
  { id: 4, title: 'Photos', icon: '📸' },
  { id: 5, title: 'Business Hours', icon: '🕐' },
]

export default function SupplierRegisterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Business Basics
    name: '',
    tagline: '',
    description: '',
    category: '',
    
    // Step 2: Contact Info
    phone_number: '',
    email: '',
    whatsapp_number: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    tiktok_url: '',
    
    // Step 3: Location
    address_line1: '',
    address_line2: '',
    city: '',
    province_state: '',
    postal_code: '',
    country: 'ZA',
    latitude: null as number | null,
    longitude: null as number | null,
    
    // Step 4: Photos
    photos: [] as File[],
    
    // Step 5: Business Hours
    business_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '', close: '', closed: true },
    }
  })

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.name || !formData.tagline || !formData.description) {
        setError('Please fill in all required fields')
        return
      }
    }
    
    if (currentStep === 2) {
      if (!formData.phone_number || !formData.email) {
        setError('Phone and email are required')
        return
      }
    }
    
    if (currentStep === 3) {
      if (!formData.address_line1 || !formData.city || !formData.latitude) {
        setError('Please provide address and capture GPS location')
        return
      }
    }

    setError('')
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      if (!user) throw new Error('Not authenticated')

      const token = await user.getIdToken()

      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add business data
      submitData.append('name', formData.name)
      submitData.append('tagline', formData.tagline)
      submitData.append('description', formData.description)
      submitData.append('category', formData.category)
      submitData.append('phone_number', formData.phone_number)
      submitData.append('email', formData.email)
      submitData.append('whatsapp_number', formData.whatsapp_number || '')
      submitData.append('website_url', formData.website_url || '')
      submitData.append('facebook_url', formData.facebook_url || '')
      submitData.append('instagram_url', formData.instagram_url || '')
      submitData.append('twitter_url', formData.twitter_url || '')
      submitData.append('linkedin_url', formData.linkedin_url || '')
      submitData.append('tiktok_url', formData.tiktok_url || '')
      submitData.append('address_line1', formData.address_line1)
      submitData.append('address_line2', formData.address_line2 || '')
      submitData.append('city', formData.city)
      submitData.append('province_state', formData.province_state)
      submitData.append('postal_code', formData.postal_code)
      submitData.append('country', formData.country)
      submitData.append('latitude', formData.latitude?.toString() || '')
      submitData.append('longitude', formData.longitude?.toString() || '')
      submitData.append('business_hours', JSON.stringify(formData.business_hours))

      // Add photos
      formData.photos.forEach((photo, index) => {
        submitData.append('photos', photo)
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submitData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const result = await response.json()
      console.log('✅ Business registered:', result)

      // Redirect to supplier dashboard
      router.push('/supplier/dashboard')
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Failed to register business')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="flex items-center gap-4 px-4 py-4">
          <Image
            src="/images/lokolo-logo.png"
            alt="Lokolo"
            width={60}
            height={60}
            className="w-15 h-15"
          />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Register Your Business</h1>
            <p className="text-sm text-text-secondary">Step {currentStep} of {STEPS.length}</p>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-cream">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                      currentStep >= step.id
                        ? 'bg-gold text-text-primary'
                        : 'bg-cream text-text-secondary'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.icon}
                  </div>
                  <span className={`text-xs mt-1 ${currentStep >= step.id ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-all ${
                      currentStep > step.id ? 'bg-gold' : 'bg-cream'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step Content */}
          {currentStep === 1 && (
            <Step1BusinessBasics
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          
          {currentStep === 2 && (
            <Step2ContactInfo
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Location
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          
          {currentStep === 4 && (
            <Step4Photos
              formData={formData}
              onChange={handleInputChange}
            />
          )}
          
          {currentStep === 5 && (
            <Step5BusinessHours
              formData={formData}
              onChange={handleInputChange}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 bg-cream text-text-primary font-bold rounded-xl hover:bg-disabled transition-colors"
              >
                ← Back
              </button>
            )}
            
            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
                    Registering...
                  </span>
                ) : (
                  'Complete Registration'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
