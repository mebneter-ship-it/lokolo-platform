'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { BusinessIcon, CameraIcon, ImageIcon, CloseIcon, SaveIcon, ArrowLeftIcon, ClockIcon } from '@/components/icons/LokoloIcons'

export default function EditBusinessPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const businessId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    category: '',  // ADDED
    email: '',
    phone_number: '',
    whatsapp_number: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    tiktok_url: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province_state: '',
    postal_code: '',
    country: 'ZA',
    latitude: 0,
    longitude: 0,
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

  const [logo, setLogo] = useState<string | null>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Load business data
  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}`, {
          headers: {
            'Authorization': `Bearer ${await user?.getIdToken()}`,
          },
        })

        if (!response.ok) throw new Error('Failed to load business')

        const data = await response.json()
        const business = data.data

        // Debug: Log the location field to see its format
        console.log('📍 Location data:', business.location)
        console.log('📍 Latitude:', business.latitude)
        console.log('📍 Longitude:', business.longitude)

        // Fetch category from business_categories table
        let category = ''
        try {
          const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}/categories`, {
            headers: {
              'Authorization': `Bearer ${await user?.getIdToken()}`,
            },
          })
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json()
            console.log('📦 Category data:', categoryData)
            if (categoryData.data && categoryData.data.length > 0) {
              category = categoryData.data[0].category_name
            }
          }
        } catch (err) {
          console.log('No category found:', err)
        }

        // Fetch business hours
        let businessHours = formData.business_hours
        try {
          const hoursResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}/hours`, {
            headers: {
              'Authorization': `Bearer ${await user?.getIdToken()}`,
            },
          })
          if (hoursResponse.ok) {
            const hoursData = await hoursResponse.json()
            if (hoursData.data && hoursData.data.length > 0) {
              // Convert to our format
              const hours: any = {}
              hoursData.data.forEach((h: any) => {
                hours[h.day_of_week] = {
                  open: h.opens_at || '09:00',
                  close: h.closes_at || '17:00',
                  closed: h.is_closed
                }
              })
              businessHours = hours
            }
          }
        } catch (err) {
          console.log('No hours found')
        }

        // Use lat/lng directly from backend (now extracted via PostGIS ST_Y/ST_X)
        const lat = business.latitude || 0
        const lng = business.longitude || 0

        setFormData({
          name: business.name || '',
          tagline: business.tagline || '',
          description: business.description || '',
          category: category,  // ADDED
          email: business.email || '',
          phone_number: business.phone_number || '',
          whatsapp_number: business.whatsapp_number || '',
          website_url: business.website_url || '',
          facebook_url: business.facebook_url || '',
          instagram_url: business.instagram_url || '',
          twitter_url: business.twitter_url || '',
          linkedin_url: business.linkedin_url || '',
          tiktok_url: business.tiktok_url || '',
          address_line1: business.address_line1 || '',
          address_line2: business.address_line2 || '',
          city: business.city || '',
          province_state: business.province_state || '',
          postal_code: business.postal_code || '',
          country: business.country || 'ZA',
          latitude: lat,
          longitude: lng,
          business_hours: businessHours,  // ADDED
        })

        // Load media
        if (business.media && business.media.length > 0) {
          const logoMedia = business.media.find((m: any) => m.media_type === 'logo')
          if (logoMedia) {
            // Generate signed URL for logo
            const logoUrl = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}/media`, {
              headers: {
                'Authorization': `Bearer ${await user?.getIdToken()}`,
              },
            }).then(r => r.json()).then(d => {
              const logo = d.data.media.find((m: any) => m.media_type === 'logo')
              return logo?.url
            })
            if (logoUrl) setLogo(logoUrl)
          }

          const photoMedia = business.media.filter((m: any) => m.media_type === 'photo')
          if (photoMedia.length > 0) {
            // Generate signed URLs for photos
            const mediaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}/media`, {
              headers: {
                'Authorization': `Bearer ${await user?.getIdToken()}`,
              },
            })
            const mediaData = await mediaResponse.json()
            const photosWithUrls = mediaData.data.media.filter((m: any) => m.media_type === 'photo')
            setPhotos(photosWithUrls)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load business')
        setLoading(false)
      }
    }

    if (user && businessId) {
      loadBusiness()
    }
  }, [user, businessId])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update business')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload logo')

      // Fetch media with signed URL
      const mediaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}/media`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      })
      const mediaData = await mediaResponse.json()
      const logoMedia = mediaData.data.media.find((m: any) => m.media_type === 'logo')
      if (logoMedia) setLogo(logoMedia.url)
    } catch (err: any) {
      console.error('Logo upload error:', err)
      setError(err.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (photos.length + files.length > 3) {
      setError('Maximum 3 photos allowed')
      return
    }

    setUploadingPhoto(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('photos', file))

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload photos')

      const data = await response.json()
      
      // Fetch media with signed URLs
      const mediaResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/businesses/${businessId}/media`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      })
      const mediaData = await mediaResponse.json()
      const photosWithUrls = mediaData.data.media.filter((m: any) => m.media_type === 'photo')
      setPhotos(photosWithUrls)
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setError(err.message || 'Failed to upload photos')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = async (mediaId: string) => {
    if (!confirm('Delete this photo?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/supplier/businesses/${businessId}/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete photo')

      setPhotos(prev => prev.filter(p => p.id !== mediaId))
    } catch (err: any) {
      console.error('Delete error:', err)
      setError(err.message || 'Failed to delete photo')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange to-gold shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/supplier/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeftIcon size={24} className="text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Edit Business</h1>
                <p className="text-sm text-white/90">{formData.name}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-white text-orange font-bold rounded-xl hover:bg-cream transition-colors disabled:opacity-50"
            >
              <SaveIcon size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-teal/10 border-2 border-teal rounded-xl">
            <p className="text-teal font-semibold">✓ Changes saved successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-orange/10 border-2 border-orange rounded-xl">
            <p className="text-orange font-semibold">{error}</p>
          </div>
        )}

        {/* Logo Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <ImageIcon size={24} className="text-gold" />
            Business Logo
          </h2>
          <div className="flex items-center gap-6">
            {logo ? (
              <div className="relative w-32 h-32">
                <img
                  src={logo}
                  alt="Business logo"
                  className="w-full h-full object-cover rounded-full border-4 border-gold"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-cream rounded-full border-4 border-dashed border-gold flex items-center justify-center">
                <ImageIcon size={40} className="text-text-secondary" />
              </div>
            )}
            <div>
              <label className="inline-block px-4 py-2 bg-gold text-text-primary font-semibold rounded-xl cursor-pointer hover:bg-light-gold transition-colors">
                {uploadingLogo ? 'Uploading...' : logo ? 'Replace Logo' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-text-secondary mt-2">
                Square format recommended • Max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <CameraIcon size={24} className="text-gold" />
            Business Photos ({photos.length}/3)
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square">
                <img
                  src={photo.url}
                  alt={photo.file_name}
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center hover:bg-orange/90 transition-colors"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <label className="aspect-square border-4 border-dashed border-gold bg-gold/5 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gold/10 transition-colors">
                <CameraIcon size={32} className="text-gold mb-2" />
                <span className="text-sm font-semibold text-text-primary">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {uploadingPhoto && (
            <p className="text-sm text-text-secondary">Uploading photos...</p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none bg-white"
              >
                <option value="">Select a category</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Coffee Shop">Coffee Shop</option>
                <option value="Bakery">Bakery</option>
                <option value="Bar/Lounge">Bar/Lounge</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Food Truck">Food Truck</option>
                <option value="Grocery Store">Grocery Store</option>
                <option value="Butchery">Butchery</option>
                <option value="Hair Salon">Hair Salon</option>
                <option value="Barbershop">Barbershop</option>
                <option value="Spa">Spa</option>
                <option value="Nail Salon">Nail Salon</option>
                <option value="Fashion Boutique">Fashion Boutique</option>
                <option value="Shoe Store">Shoe Store</option>
                <option value="Jewelry Store">Jewelry Store</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Home Decor">Home Decor</option>
                <option value="Bookstore">Bookstore</option>
                <option value="Art Gallery">Art Gallery</option>
                <option value="Gym/Fitness">Gym/Fitness</option>
                <option value="Yoga Studio">Yoga Studio</option>
                <option value="Sports Store">Sports Store</option>
                <option value="Auto Repair">Auto Repair</option>
                <option value="Car Wash">Car Wash</option>
                <option value="Construction">Construction</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Tech/IT Services">Tech/IT Services</option>
                <option value="Marketing Agency">Marketing Agency</option>
                <option value="Consulting">Consulting</option>
                <option value="Accounting">Accounting</option>
                <option value="Legal Services">Legal Services</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Event Planning">Event Planning</option>
                <option value="Photography">Photography</option>
                <option value="Music/Entertainment">Music/Entertainment</option>
                <option value="Hotel/Lodge">Hotel/Lodge</option>
                <option value="Tour Operator">Tour Operator</option>
                <option value="Travel Agency">Travel Agency</option>
                <option value="Education/Training">Education/Training</option>
                <option value="Daycare">Daycare</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp_number}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => handleChange('website_url', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4">Location</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Province/State
                </label>
                <input
                  type="text"
                  value={formData.province_state}
                  onChange={(e) => handleChange('province_state', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0000001"
                  value={formData.latitude}
                  onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0000001"
                  value={formData.longitude}
                  onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <ClockIcon size={24} className="text-gold" />
            Business Hours
          </h2>
          <div className="space-y-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const dayName = day.charAt(0).toUpperCase() + day.slice(1)
              const hours = formData.business_hours[day]
              
              return (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-32">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => {
                          const newHours = { ...formData.business_hours }
                          newHours[day] = { ...hours, closed: !e.target.checked }
                          handleChange('business_hours', newHours)
                        }}
                        className="w-4 h-4 text-gold focus:ring-gold border-cream rounded"
                      />
                      <span className="font-semibold text-text-primary">{dayName}</span>
                    </label>
                  </div>

                  {hours.closed ? (
                    <span className="text-text-secondary italic">Closed</span>
                  ) : (
                    <>
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => {
                          const newHours = { ...formData.business_hours }
                          newHours[day] = { ...hours, open: e.target.value }
                          handleChange('business_hours', newHours)
                        }}
                        className="px-3 py-2 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                      />
                      <span className="text-text-secondary">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => {
                          const newHours = { ...formData.business_hours }
                          newHours[day] = { ...hours, close: e.target.value }
                          handleChange('business_hours', newHours)
                        }}
                        className="px-3 py-2 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/supplier/dashboard')}
            className="flex-1 py-4 border-2 border-gold text-gold font-bold rounded-xl hover:bg-gold hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-4 bg-gold text-text-primary font-bold rounded-xl hover:bg-light-gold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
