import React from 'react'

interface Step5Props {
  formData: any
  onChange: (field: string, value: any) => void
}

export default function Step5BusinessHours({ formData, onChange }: Step5Props) {
  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]

  const handleDayChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const updatedHours = {
      ...formData.business_hours,
      [day]: {
        ...formData.business_hours[day],
        [field]: value,
      }
    }
    onChange('business_hours', updatedHours)
  }

  const copyToAll = (day: string) => {
    const sourceHours = formData.business_hours[day]
    const updatedHours = { ...formData.business_hours }
    
    Object.keys(updatedHours).forEach(key => {
      if (key !== day && !updatedHours[key].closed) {
        updatedHours[key] = { ...sourceHours }
      }
    })
    
    onChange('business_hours', updatedHours)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">When are you open?</h2>
        <p className="text-text-secondary">Set your business hours for each day</p>
      </div>

      {/* Business Hours */}
      <div className="space-y-3">
        {days.map(({ key, label }) => {
          const dayHours = formData.business_hours[key]
          
          return (
            <div key={key} className="bg-white border-2 border-cream rounded-xl p-4">
              <div className="flex items-center gap-4">
                {/* Day Name */}
                <div className="w-32">
                  <span className="font-bold text-text-primary">{label}</span>
                </div>

                {/* Closed Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayHours.closed}
                    onChange={(e) => handleDayChange(key, 'closed', e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-text-secondary checked:bg-gold checked:border-gold"
                  />
                  <span className="text-sm text-text-secondary">Closed</span>
                </label>

                {/* Time Inputs */}
                {!dayHours.closed && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={dayHours.open}
                        onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                        className="px-3 py-2 rounded-lg border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                      />
                      <span className="text-text-secondary">to</span>
                      <input
                        type="time"
                        value={dayHours.close}
                        onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                        className="px-3 py-2 rounded-lg border-2 border-cream focus:border-gold focus:outline-none text-text-primary"
                      />
                    </div>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => copyToAll(key)}
                      className="ml-auto px-3 py-2 text-xs bg-cream text-text-primary font-semibold rounded-lg hover:bg-gold transition-colors"
                      title="Copy these hours to all open days"
                    >
                      Copy to all
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Templates */}
      <div className="bg-cream rounded-xl p-4">
        <h3 className="font-bold text-text-primary mb-3">⚡ Quick Templates:</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              const weekdayHours = { open: '09:00', close: '17:00', closed: false }
              onChange('business_hours', {
                monday: weekdayHours,
                tuesday: weekdayHours,
                wednesday: weekdayHours,
                thursday: weekdayHours,
                friday: weekdayHours,
                saturday: { open: '09:00', close: '14:00', closed: false },
                sunday: { open: '', close: '', closed: true },
              })
            }}
            className="px-4 py-2 bg-white text-text-primary font-semibold rounded-lg hover:bg-gold transition-colors text-sm"
          >
            9-5 Weekdays
          </button>

          <button
            type="button"
            onClick={() => {
              const allDayHours = { open: '08:00', close: '20:00', closed: false }
              onChange('business_hours', {
                monday: allDayHours,
                tuesday: allDayHours,
                wednesday: allDayHours,
                thursday: allDayHours,
                friday: allDayHours,
                saturday: allDayHours,
                sunday: allDayHours,
              })
            }}
            className="px-4 py-2 bg-white text-text-primary font-semibold rounded-lg hover:bg-gold transition-colors text-sm"
          >
            8-8 Every Day
          </button>

          <button
            type="button"
            onClick={() => {
              const retailHours = { open: '10:00', close: '18:00', closed: false }
              onChange('business_hours', {
                monday: retailHours,
                tuesday: retailHours,
                wednesday: retailHours,
                thursday: retailHours,
                friday: { open: '10:00', close: '20:00', closed: false },
                saturday: { open: '09:00', close: '17:00', closed: false },
                sunday: { open: '10:00', close: '15:00', closed: false },
              })
            }}
            className="px-4 py-2 bg-white text-text-primary font-semibold rounded-lg hover:bg-gold transition-colors text-sm"
          >
            Retail Hours
          </button>

          <button
            type="button"
            onClick={() => {
              const closedDay = { open: '', close: '', closed: true }
              onChange('business_hours', {
                monday: closedDay,
                tuesday: closedDay,
                wednesday: closedDay,
                thursday: closedDay,
                friday: closedDay,
                saturday: closedDay,
                sunday: closedDay,
              })
            }}
            className="px-4 py-2 bg-white text-text-primary font-semibold rounded-lg hover:bg-gold transition-colors text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
