'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import Step1BusinessBasics from '@/components/supplier/Step1BusinessBasics'
import Step2ContactInfo from '@/components/supplier/Step2ContactInfo'
import Step3Location from '@/components/supplier/Step3Location'
import Step4Logo from '@/components/supplier/Step4Logo'
import Step5Photos from '@/components/supplier/Step5Photos'
import Step6BusinessHours from '@/components/supplier/Step6BusinessHours'
import { BusinessIcon, PhoneIcon, LocationIcon, ImageIcon, CameraIcon, ClockIcon, CheckIcon } from '@/components/icons/LokoloIcons'

// Form steps with brand-colored icon components
const STEPS = [
  { id: 1, title: 'Business Basics', Icon: BusinessIcon },
  { id: 2, title: 'Contact Info', Icon: PhoneIcon },
  { id: 3, title: 'Location', Icon: LocationIcon },
  { id: 4, title: 'Logo', Icon: ImageIcon },
  { id: 5, title: 'Photos', Icon: CameraIcon },
  { id: 6, title: 'Hours', Icon: ClockIcon },
]

export default function SupplierRegisterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Step 1
    name: '',
    tagline: '',
    description: '',
    category: '',
    // Step 2
    email: '',
    phone_number: '',
    whatsapp_number: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    tiktok_url: '',
    // Step 3
    latitude: 0,
    longitude: 0,
    address_line1: '',
    address_line2: '',
    city: '',
    province_state: '',
    postal_code: '',
    country: 'ZA',
    // Step 4 - Logo
    logo: null as File | null,
    // Step 5 - Photos
    photos: [] as File[],
    // Step 6 - Business Hours
    business_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true },
    }
  })

  // For Steps 1, 2, 3, 5 - they use onChange(field, value)
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // For Step 4 - it uses updateFormData(object)
  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Create FormData for multipart upload
      const submitData = new FormData()
      
      // Debug: Log formData to see what we have
      console.log('📋 FormData before submission:', {
        name: formData.name,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address_line1: formData.address_line1,
        category: formData.category,
        hasLogo: !!formData.logo,
        photosCount: formData.photos.length,
      })
      
      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'logo') {
          // Handle logo separately with media_type='logo'
          if (formData.logo) {
            submitData.append('logo', formData.logo)
          }
        } else if (key === 'photos') {
          // Handle photos with media_type='photo'
          formData.photos.forEach((photo) => {
            submitData.append('photos', photo)
          })
        } else if (key === 'business_hours') {
          // Stringify business hours
          submitData.append('business_hours', JSON.stringify(value))
        } else if (value !== null && value !== undefined && value !== '') {
          submitData.append(key, String(value))
        }
      })

      // FIXED: Use correct API endpoint with full URL
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: submitData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create business')
      }

      const data = await response.json()
      
      // Success! Redirect to dashboard
      router.push('/supplier/dashboard')
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Failed to register business')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header with orange-gold gradient matching consumer page */}
      <header className="bg-gradient-to-r from-orange to-gold shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo and Title - Left aligned */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/lokolo-logo.png"
                alt="Lokolo"
                width={60}
                height={60}
                className="rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Register Your Business</h1>
                <p className="text-sm text-white/90">Step {currentStep} of {STEPS.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar with brand-colored icons */}
      <div className="bg-white border-b border-cream">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.Icon;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all mb-2 ${
                        currentStep > step.id
                          ? 'bg-teal text-white'  // Completed: teal
                          : currentStep === step.id
                          ? 'bg-gold text-text-primary shadow-lg scale-110'  // Current: gold
                          : 'bg-cream text-text-secondary'  // Future: cream
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckIcon size={24} className="text-white" />
                      ) : (
                        <StepIcon size={24} className={currentStep === step.id ? 'text-text-primary' : 'text-text-secondary'} />
                      )}
                    </div>
                    <span className={`text-xs text-center font-medium whitespace-nowrap ${
                      currentStep >= step.id ? 'text-text-primary' : 'text-text-secondary'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        currentStep > step.id ? 'bg-teal' : 'bg-cream'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && (
            <Step1BusinessBasics formData={formData} onChange={handleFieldChange} />
          )}
          {currentStep === 2 && (
            <Step2ContactInfo formData={formData} onChange={handleFieldChange} />
          )}
          {currentStep === 3 && (
            <Step3Location formData={formData} onChange={handleFieldChange} />
          )}
          {currentStep === 4 && (
            <Step4Logo formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 5 && (
            <Step5Photos formData={formData} updateFormData={updateFormData} />
          )}
          {currentStep === 6 && (
            <Step6BusinessHours formData={formData} onChange={handleFieldChange} />
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3 border-2 border-gold text-gold font-bold rounded-xl hover:bg-gold hover:text-white transition-all"
              >
                Back
              </button>
            )}
            
            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-teal text-white font-bold rounded-xl shadow-md hover:bg-teal/90 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Complete Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
