'use client'

import { ClockIcon } from '@/components/icons/LokoloIcons'

interface Step6BusinessHoursProps {
  formData: {
    business_hours: {
      [key: string]: {
        open: string
        close: string
        closed: boolean
      }
    }
  }
  onChange: (field: string, value: any) => void
}

const days = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export default function Step6BusinessHours({ formData, onChange }: Step6BusinessHoursProps) {
  const handleDayChange = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    const updated = {
      ...formData.business_hours,
      [day]: {
        ...formData.business_hours[day],
        [field]: value,
      },
    }
    onChange('business_hours', updated)
  }

  const copyToAll = (day: string) => {
    const template = formData.business_hours[day]
    const updated = { ...formData.business_hours }
    days.forEach(d => {
      updated[d.key] = { ...template }
    })
    onChange('business_hours', updated)
  }

  const apply9to5Weekdays = () => {
    const updated = { ...formData.business_hours }
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    weekdays.forEach(day => {
      updated[day] = { open: '09:00', close: '17:00', closed: false }
    })
    onChange('business_hours', updated)
  }

  const applyRetailHours = () => {
    const updated = { ...formData.business_hours }
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    allDays.forEach(day => {
      updated[day] = { open: '08:00', close: '20:00', closed: false }
    })
    onChange('business_hours', updated)
  }

  const clearAll = () => {
    const updated = { ...formData.business_hours }
    days.forEach(d => {
      updated[d.key] = { open: '09:00', close: '17:00', closed: true }
    })
    onChange('business_hours', updated)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">
        When are you open?
      </h2>
      <p className="text-text-secondary mb-6">
        Set your business hours for each day
      </p>

      <div className="space-y-4">
        {days.map(({ key, label }) => {
          const hours = formData.business_hours[key]
          return (
            <div key={key} className="flex items-center gap-4">
              <div className="w-32">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) => handleDayChange(key, 'closed', !e.target.checked)}
                    className="w-4 h-4 text-gold focus:ring-gold border-cream rounded"
                  />
                  <span className="font-semibold text-text-primary">{label}</span>
                </label>
              </div>

              {hours.closed ? (
                <span className="text-text-secondary italic">Closed</span>
              ) : (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                    className="px-3 py-2 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                  />
                  <span className="text-text-secondary">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                    className="px-3 py-2 rounded-xl border-2 border-cream focus:border-gold focus:outline-none"
                  />
                </>
              )}

              <button
                type="button"
                onClick={() => copyToAll(key)}
                className="ml-auto px-3 py-2 text-sm text-gold hover:bg-gold/10 rounded-lg transition-colors"
              >
                Copy to all
              </button>
            </div>
          )
        })}
      </div>

      {/* Quick Templates */}
      <div className="mt-6 p-4 bg-gold/10 border-2 border-gold/20 rounded-xl">
        <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
          <ClockIcon size={20} className="text-gold" />
          Quick Templates:
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={apply9to5Weekdays}
            className="px-4 py-2 bg-white border-2 border-gold text-text-primary font-semibold rounded-xl hover:bg-gold hover:text-white transition-colors"
          >
            9-5 Weekdays
          </button>
          <button
            type="button"
            onClick={applyRetailHours}
            className="px-4 py-2 bg-white border-2 border-gold text-text-primary font-semibold rounded-xl hover:bg-gold hover:text-white transition-colors"
          >
            8-8 Every Day
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="col-span-2 px-4 py-2 bg-white border-2 border-cream text-text-secondary font-semibold rounded-xl hover:bg-cream transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
