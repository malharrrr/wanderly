'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const INTERESTS = ['Food', 'Culture', 'Adventure', 'Shopping', 'Nature', 'Nightlife', 'Museums', 'History', 'Beaches', 'Architecture']
const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget', desc: 'Hostels, street food, free sights' },
  { value: 'medium', label: 'Mid-range', desc: 'Hotels, restaurants, some tours' },
  { value: 'high', label: 'Luxury', desc: 'Premium hotels, fine dining, private tours' },
]

export default function PlanPage() {
  const router = useRouter()
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(5)
  const [budget, setBudget] = useState('medium')
  const [interests, setInterests] = useState<string[]>(['Culture', 'Food'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleInterest(interest: string) {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!destination.trim()) return setError('Please enter a destination')
    if (interests.length === 0) return setError('Please select at least one interest')
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destination.trim(), days, budgetType: budget, interests }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate trip')
      router.push(`/trips/${data._id}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-amber-100 bg-white">
        <h1 className="page-title">Plan a trip ✨</h1>
        <p className="page-subtitle">Tell us your dream — our AI will build the perfect itinerary</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <form onSubmit={handleSubmit} className="max-w-2xl">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Destination */}
          <div className="card mb-4">
            <label className="label block">Where do you want to go?</label>
            <input
              className="input-field text-base"
              placeholder="e.g. Kyoto, Japan"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Days */}
          <div className="card mb-4">
            <label className="label block">How many days?</label>
            <div className="flex items-center gap-4 mt-1">
              <input
                type="range"
                min={1}
                max={21}
                step={1}
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                disabled={loading}
                className="flex-1 accent-amber-600"
              />
              <div className="w-16 text-center bg-amber-50 border border-amber-200 rounded-xl py-2 font-lora text-lg font-semibold text-amber-900">
                {days}
              </div>
            </div>
            <div className="flex justify-between text-xs text-amber-400 mt-1 px-0.5">
              <span>1 day</span>
              <span>21 days</span>
            </div>
          </div>

          {/* Budget */}
          <div className="card mb-4">
            <label className="label block">Budget level</label>
            <div className="grid grid-cols-3 gap-3 mt-1">
              {BUDGET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBudget(opt.value)}
                  disabled={loading}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    budget === opt.value
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-amber-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className={`text-sm font-medium ${budget === opt.value ? 'text-amber-700' : 'text-stone-700'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-amber-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="card mb-6">
            <label className="label block">What are you into?</label>
            <p className="text-xs text-amber-600 mb-3">Select all that apply — the AI will tailor your itinerary</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  disabled={loading}
                  className={`chip ${interests.includes(interest) ? 'chip-selected' : ''}`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Claude is crafting your itinerary...</span>
              </>
            ) : (
              <>✨ Generate my itinerary</>
            )}
          </button>

          {loading && (
            <p className="text-center text-xs text-amber-600 mt-3">
              This takes about 10–15 seconds. Hang tight!
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
