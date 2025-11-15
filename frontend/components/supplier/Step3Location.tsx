import React, { useState } from 'react'

interface Step3Props {
  formData: any
  onChange: (field: string, value: any) => void
}

export default function Step3Location({ formData, onChange }: Step3Props) {
  const [capturing, setCapturing] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const captureGPS = () => {
    setCapturing(true)
    setGpsError('')

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange('latitude', position.coords.latitude)
          onChange('longitude', position.coords.longitude)
          setCapturing(false)
          console.log('✅ GPS captured:', position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          setCapturing(false)
          setGpsError('Failed to get location. Please enable location services.')
          console.error('GPS error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      )
    } else {
      setCapturing(false)
      setGpsError('Geolocation is not supported by your browser')
    }
  }

  const provinces = [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'Northern Cape',
    'North West',
    'Western Cape',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Where is your business located?</h2>
        <p className="text-text-secondary">Help customers find you easily</p>
      </div>

      {/* GPS Capture */}
      <div className="bg-cream rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-text-primary mb-2">📍 Capture GPS Location</h3>
            {formData.latitude && formData.longitude ? (
              <div className="space-y-2">
                <p className="text-sm text-teal font-semibold">✓ Location captured successfully!</p>
                <p className="text-xs text-text-secondary">
                  Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-text-secondary mb-4">
                We need your exact location to show your business on the map
              </p>
            )}
            {gpsError && (
              <p className="text-sm text-red-600 mb-4">{gpsError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={captureGPS}
            disabled={capturing}
            className="px-6 py-3 bg-gold text-text-primary font-bold rounded-xl shadow-md hover:bg-light-gold active:scale-98 transition-all disabled:opacity-50"
          >
            {capturing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-text-primary border-t-transparent rounded-full animate-spin"></div>
                Capturing...
              </span>
            ) : formData.latitude ? (
              'Re-capture'
            ) : (
              'Capture Location'
            )}
          </button>
        </div>
      </div>

      {/* Address Line 1 */}
      <div>
        <label htmlFor="address_line1" className="block text-sm font-semibold text-text-primary mb-2">
          Street Address <span className="text-orange">*</span>
        </label>
        <input
          id="address_line1"
          type="text"
          value={formData.address_line1}
          onChange={(e) => onChange('address_line1', e.target.value)}
          placeholder="123 Main Street"
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label htmlFor="address_line2" className="block text-sm font-semibold text-text-primary mb-2">
          Building / Unit (Optional)
        </label>
        <input
          id="address_line2"
          type="text"
          value={formData.address_line2}
          onChange={(e) => onChange('address_line2', e.target.value)}
          placeholder="Unit 5, 2nd Floor"
          className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* City and Province */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-semibold text-text-primary mb-2">
            City <span className="text-orange">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Johannesburg"
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div>
          <label htmlFor="province_state" className="block text-sm font-semibold text-text-primary mb-2">
            Province <span className="text-orange">*</span>
          </label>
          <select
            id="province_state"
            value={formData.province_state}
            onChange={(e) => onChange('province_state', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          >
            <option value="">Select province</option>
            {provinces.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Postal Code and Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="postal_code" className="block text-sm font-semibold text-text-primary mb-2">
            Postal Code <span className="text-orange">*</span>
          </label>
          <input
            id="postal_code"
            type="text"
            value={formData.postal_code}
            onChange={(e) => onChange('postal_code', e.target.value)}
            placeholder="2000"
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-semibold text-text-primary mb-2">
            Country
          </label>
          <input
            id="country"
            type="text"
            value="South Africa"
            disabled
            className="w-full px-4 py-3 rounded-xl border-2 border-cream bg-disabled text-text-secondary"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>
    </div>
  )
}
