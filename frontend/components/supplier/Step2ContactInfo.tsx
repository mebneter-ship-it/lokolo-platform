import React from 'react'

interface Step2Props {
  formData: any
  onChange: (field: string, value: string) => void
}

export default function Step2ContactInfo({ formData, onChange }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">How can customers reach you?</h2>
        <p className="text-text-secondary">Add your contact details and social media</p>
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="phone_number" className="block text-sm font-semibold text-text-primary mb-2">
          Phone Number <span className="text-orange">*</span>
        </label>
        <input
          id="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => onChange('phone_number', e.target.value)}
          placeholder="+27821111111"
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
          Email Address <span className="text-orange">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="info@yourbusiness.co.za"
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label htmlFor="whatsapp_number" className="block text-sm font-semibold text-text-primary mb-2">
          WhatsApp Number
        </label>
        <input
          id="whatsapp_number"
          type="tel"
          value={formData.whatsapp_number}
          onChange={(e) => onChange('whatsapp_number', e.target.value)}
          placeholder="+27821111111 (optional)"
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
        <p className="text-xs text-text-secondary mt-1">Customers can contact you directly on WhatsApp</p>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-cream"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 bg-white text-sm font-semibold text-text-secondary">
            Online Presence
          </span>
        </div>
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website_url" className="block text-sm font-semibold text-text-primary mb-2">
          🌐 Website
        </label>
        <input
          id="website_url"
          type="url"
          value={formData.website_url}
          onChange={(e) => onChange('website_url', e.target.value)}
          placeholder="https://yourbusiness.co.za"
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Social Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Facebook */}
        <div>
          <label htmlFor="facebook_url" className="block text-sm font-semibold text-text-primary mb-2">
            📘 Facebook
          </label>
          <input
            id="facebook_url"
            type="url"
            value={formData.facebook_url}
            onChange={(e) => onChange('facebook_url', e.target.value)}
            placeholder="https://facebook.com/..."
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Instagram */}
        <div>
          <label htmlFor="instagram_url" className="block text-sm font-semibold text-text-primary mb-2">
            📸 Instagram
          </label>
          <input
            id="instagram_url"
            type="url"
            value={formData.instagram_url}
            onChange={(e) => onChange('instagram_url', e.target.value)}
            placeholder="https://instagram.com/..."
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Twitter */}
        <div>
          <label htmlFor="twitter_url" className="block text-sm font-semibold text-text-primary mb-2">
            🐦 Twitter / X
          </label>
          <input
            id="twitter_url"
            type="url"
            value={formData.twitter_url}
            onChange={(e) => onChange('twitter_url', e.target.value)}
            placeholder="https://twitter.com/..."
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label htmlFor="linkedin_url" className="block text-sm font-semibold text-text-primary mb-2">
            💼 LinkedIn
          </label>
          <input
            id="linkedin_url"
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => onChange('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/company/..."
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* TikTok */}
        <div>
          <label htmlFor="tiktok_url" className="block text-sm font-semibold text-text-primary mb-2">
            🎵 TikTok
          </label>
          <input
            id="tiktok_url"
            type="url"
            value={formData.tiktok_url}
            onChange={(e) => onChange('tiktok_url', e.target.value)}
            placeholder="https://tiktok.com/@..."
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>
    </div>
  )
}
