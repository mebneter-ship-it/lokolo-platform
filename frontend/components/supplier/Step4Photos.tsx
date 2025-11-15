import React, { useRef, useState } from 'react'

interface Step4Props {
  formData: any
  onChange: (field: string, value: any) => void
}

export default function Step4Photos({ formData, onChange }: Step4Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Limit to 3 photos total
    const currentPhotos = formData.photos || []
    const availableSlots = 3 - currentPhotos.length
    const filesToAdd = files.slice(0, availableSlots)

    if (filesToAdd.length === 0) {
      alert('Maximum 3 photos allowed')
      return
    }

    // Validate file types and sizes
    const validFiles = filesToAdd.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isUnder5MB = file.size <= 5 * 1024 * 1024

      if (!isImage) {
        alert(`${file.name} is not an image file`)
        return false
      }
      if (!isUnder5MB) {
        alert(`${file.name} is larger than 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Update formData with new photos
    const updatedPhotos = [...currentPhotos, ...validFiles]
    onChange('photos', updatedPhotos)

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    const updatedPhotos = formData.photos.filter((_: any, i: number) => i !== index)
    onChange('photos', updatedPhotos)
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Show off your business</h2>
        <p className="text-text-secondary">Upload up to 3 photos (max 5MB each)</p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Existing Photos */}
        {previews.map((preview, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-cream border-2 border-gold">
            <img
              src={preview}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              ✕
            </button>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Photo {index + 1}
            </div>
          </div>
        ))}

        {/* Empty Slots */}
        {Array.from({ length: 3 - previews.length }).map((_, index) => (
          <button
            key={`empty-${index}`}
            type="button"
            onClick={handleBrowseClick}
            className="aspect-square rounded-xl border-2 border-dashed border-cream hover:border-gold bg-cream/50 hover:bg-cream transition-all flex flex-col items-center justify-center gap-2"
          >
            <span className="text-4xl text-text-secondary">📸</span>
            <span className="text-xs text-text-secondary font-semibold">Add Photo</span>
          </button>
        ))}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      {previews.length < 3 && (
        <button
          type="button"
          onClick={handleBrowseClick}
          className="w-full py-4 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all"
        >
          📷 Browse Photos ({previews.length}/3)
        </button>
      )}

      {/* Tips */}
      <div className="bg-cream rounded-xl p-4">
        <h3 className="font-bold text-text-primary mb-2">📸 Photo Tips:</h3>
        <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
          <li>Use high-quality, well-lit photos</li>
          <li>Show your products, services, or storefront</li>
          <li>Photos must be under 5MB each</li>
          <li>First photo will be your main display image</li>
        </ul>
      </div>
    </div>
  )
}
