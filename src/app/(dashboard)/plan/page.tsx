'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PlanPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const SUGGESTIONS = [
    "Leaving from San Francisco for 10 days in Kyoto in late April, traveling solo. Include a ryokan at the end.",
    "A cheap weekend getaway leaving from London to Berlin for two. We love techno and street food.",
    "Flying out of Miami for 5 days in New York City with kids in December. Festive vibe.",
  ]

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!prompt.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
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
    <div className="flex flex-col h-full items-center justify-center p-8 bg-cream-50">
      <div className="max-w-2xl w-full text-center mb-8">
        <h1 className="text-4xl font-lora font-semibold text-amber-900 mb-3">Where to next?</h1>
        <p className="text-amber-700">Type your dream trip. Our AI will handle the logistics, weather, and budget.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl relative">
        {error && (
          <div className="absolute -top-12 left-0 w-full px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          placeholder='e.g., A 5-day honeymoon in Bali leaving from New York next October. We love luxury hotels and quiet beaches.'
          className="w-full bg-white border-2 border-amber-200 rounded-2xl p-5 text-lg text-stone-800 placeholder:text-amber-300 focus:outline-none focus:border-amber-500 shadow-sm resize-none h-32"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="absolute bottom-4 right-4 btn-primary"
        >
          {loading ? 'Crafting Itinerary...' : '✨ Generate'}
        </button>
      </form>

      {!loading && (
        <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-2xl">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="text-xs bg-amber-100 text-amber-800 px-4 py-2 rounded-full hover:bg-amber-200 transition-colors border border-transparent hover:border-amber-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}