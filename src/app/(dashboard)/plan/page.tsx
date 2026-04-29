'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AVAILABLE_INTERESTS = [
  "Culture", "Food", "Nature", "Adventure", 
  "Relaxation", "Nightlife", "Shopping", "History"
]

export default function PlanPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [budgetTier, setBudgetTier] = useState('Mid-range')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const SUGGESTIONS = [
    "Leaving from San Francisco for 10 days in Kyoto, traveling solo. Include a ryokan at the end.",
    "A weekend getaway leaving from London to Berlin for two. We love techno and street food.",
    "Flying out of Miami for 5 days in New York City with kids. Festive vibe.",
  ]

  function toggleInterest(interest: string) {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest))
    } else {
      setSelectedInterests([...selectedInterests, interest])
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!prompt.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, travelDate, budgetTier, interests: selectedInterests }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate trip')
      router.push(`/trips/${data._id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to generate trip. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full items-center justify-start p-8 bg-cream-50 overflow-y-auto">
      <div className="max-w-2xl w-full text-center mb-8 mt-4">
        <h1 className="text-4xl font-lora font-semibold text-amber-900 mb-3">Where to next?</h1>
        <p className="text-amber-700">Type your dream trip. Our AI will handle the logistics, weather, and budget.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl relative space-y-6">
        {error && (
          <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          placeholder='e.g., A 5-day honeymoon in Bali leaving from New York. We want quiet beaches.'
          className="w-full bg-white border-2 border-amber-200 rounded-2xl p-5 text-lg text-stone-800 placeholder:text-amber-300 focus:outline-none focus:border-amber-500 shadow-sm resize-none h-32"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
          
          {/* travel date */}
          <div>
            <label className="block text-sm font-semibold text-amber-900 mb-2">When are you traveling?</label>
            <input 
              type="month" 
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="input-field cursor-pointer"
            />
          </div>

          {/* budget */}
          <div>
            <label className="block text-sm font-semibold text-amber-900 mb-2">What is your budget?</label>
            <select 
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="input-field cursor-pointer"
            >
              <option value="Budget-friendly">Budget-friendly</option>
              <option value="Mid-range">Mid-range</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>

          {/* interests */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-amber-900 mb-2">Select your interests</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`chip ${selectedInterests.includes(interest) ? 'chip-selected' : ''}`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full btn-primary py-4 text-lg shadow-md hover:shadow-lg"
        >
          {loading ? 'Crafting Itinerary...' : '✨ Generate Trip'}
        </button>
      </form>

      {!loading && (
        <div className="mt-12 flex flex-wrap justify-center gap-3 max-w-2xl">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="text-xs bg-amber-100 text-amber-800 px-4 py-2 rounded-full hover:bg-amber-200 transition-colors border border-transparent hover:border-amber-300 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}