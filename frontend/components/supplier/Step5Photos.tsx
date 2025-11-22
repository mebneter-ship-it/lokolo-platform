import React, { useRef, useState } from 'react'
import { CameraIcon, CloseIcon } from '@/components/icons/LokoloIcons'

interface Step5PhotosProps {
  formData: {
    photos: File[]
  }
  updateFormData: (data: Partial<Step5PhotosProps['formData']>) => void
}

export default function Step5Photos({ formData, updateFormData }: Step5PhotosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newPhotos = [...formData.photos, ...files].slice(0, 3)
    updateFormData({ photos: newPhotos })

    // Create previews
    const newPreviews = newPhotos.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
  }

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index)
    updateFormData({ photos: newPhotos })

    const newPreviews = previews.filter((_, i) => i !== index)
    setPreviews(newPreviews)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Business Photos</h2>
        <p className="text-text-secondary">
          Add up to 3 photos of your business (optional)
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Filled Slots */}
        {previews.map((preview, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-teal shadow-lg">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center hover:bg-orange/80 transition-colors shadow-lg"
            >
              <CloseIcon size={16} className="text-white" />
            </button>
          </div>
        ))}

        {/* Empty Slots */}
        {Array.from({ length: 3 - previews.length }).map((_, index) => (
          <button
            key={`empty-${index}`}
            type="button"
            onClick={handleBrowseClick}
            className="aspect-square rounded-xl border-2 border-dashed border-gold hover:border-orange bg-cream/50 hover:bg-cream transition-all flex flex-col items-center justify-center gap-2 shadow-sm"
          >
            <CameraIcon size={40} className="text-gold" />
            <span className="text-xs text-text-primary font-semibold">Add Photo</span>
          </button>
        ))}
      </div>

      {/* Upload Button */}
      {previews.length < 3 && (
        <button
          type="button"
          onClick={handleBrowseClick}
          className="w-full py-4 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all"
        >
          <span className="inline-flex items-center gap-2">
            <CameraIcon size={20} />
            <span>Browse Photos ({previews.length}/3)</span>
          </span>
        </button>
      )}

      {/* Info Text */}
      <div className="bg-cream rounded-xl p-4 border border-gold/20">
        <p className="text-sm text-text-secondary text-center">
          💡 <strong>Tip:</strong> Add clear photos of your storefront, interior, or products. 
          Great photos help customers find and trust your business!
        </p>
      </div>
    </div>
  )
}
