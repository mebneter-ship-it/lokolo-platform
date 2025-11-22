'use client'

import { useState } from 'react'
import { CameraIcon, CloseIcon } from '@/components/icons/LokoloIcons'

interface Step4LogoProps {
  formData: {
    logo: File | null
  }
  updateFormData: (data: any) => void
}

export default function Step4Logo({ formData, updateFormData }: Step4LogoProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo must be less than 5MB')
      return
    }

    // Set preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Update form data
    updateFormData({ logo: file })
  }

  const handleRemoveLogo = () => {
    setPreview(null)
    updateFormData({ logo: null })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        Upload Your Business Logo
      </h2>
      <p className="text-text-secondary mb-6">
        Your logo helps customers recognize your brand. Use a square image for best results.
      </p>

      <div className="space-y-6">
        {/* Logo Upload Area */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-3">
            Business Logo <span className="text-orange">*</span>
          </label>
          
          {preview ? (
            // Logo Preview
            <div className="relative w-64 h-64 mx-auto">
              <img
                src={preview}
                alt="Logo preview"
                className="w-full h-full object-cover rounded-2xl border-4 border-gold shadow-lg"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-3 -right-3 w-10 h-10 bg-orange text-white rounded-full flex items-center justify-center hover:bg-orange/90 transition-colors shadow-lg"
              >
                <CloseIcon size={20} />
              </button>
            </div>
          ) : (
            // Upload Button
            <label className="block w-64 h-64 mx-auto cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <div className="w-full h-full border-4 border-dashed border-gold bg-gold/5 rounded-2xl flex flex-col items-center justify-center hover:bg-gold/10 transition-colors">
                <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mb-4">
                  <CameraIcon size={40} className="text-text-primary" />
                </div>
                <p className="text-text-primary font-bold mb-2">Upload Logo</p>
                <p className="text-text-secondary text-sm text-center px-4">
                  Click to select your business logo
                  <br />
                  (Square format recommended)
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Guidelines */}
        <div className="bg-teal/10 border-2 border-teal/20 rounded-xl p-4">
          <h3 className="font-bold text-text-primary mb-2 flex items-center gap-2">
            <span className="text-teal">✓</span>
            Logo Guidelines
          </h3>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Use a square image (1:1 ratio) for best results</li>
            <li>• High resolution (minimum 500x500px recommended)</li>
            <li>• Clear, simple design that represents your brand</li>
            <li>• Maximum file size: 5MB</li>
            <li>• Accepted formats: JPG, PNG, WebP</li>
          </ul>
        </div>

        {/* Skip Option */}
        {!preview && (
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Don't have a logo yet? You can add one later from your dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
