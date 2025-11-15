import React from 'react'

interface Step1Props {
  formData: any
  onChange: (field: string, value: string) => void
}

export default function Step1BusinessBasics({ formData, onChange }: Step1Props) {
  const categories = [
    'Coffee Shop',
    'Restaurant',
    'Bakery',
    'Fashion & Clothing',
    'Beauty & Salon',
    'Technology',
    'Retail',
    'Services',
    'Other'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Tell us about your business</h2>
        <p className="text-text-secondary">Let customers know what makes your business special</p>
      </div>

      {/* Business Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-text-primary mb-2">
          Business Name <span className="text-orange">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Ubuntu Coffee Roasters"
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Tagline */}
      <div>
        <label htmlFor="tagline" className="block text-sm font-semibold text-text-primary mb-2">
          Tagline <span className="text-orange">*</span>
        </label>
        <input
          id="tagline"
          type="text"
          value={formData.tagline}
          onChange={(e) => onChange('tagline', e.target.value)}
          placeholder="Artisan coffee from African beans"
          maxLength={100}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
        <p className="text-xs text-text-secondary mt-1">{formData.tagline.length}/100 characters</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-semibold text-text-primary mb-2">
          Category <span className="text-orange">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-text-primary mb-2">
          Description <span className="text-orange">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Tell customers about your business, what you offer, and what makes you unique..."
          rows={6}
          maxLength={500}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary resize-none"
          style={{ fontSize: '16px' }}
        />
        <p className="text-xs text-text-secondary mt-1">{formData.description.length}/500 characters</p>
      </div>
    </div>
  )
}
