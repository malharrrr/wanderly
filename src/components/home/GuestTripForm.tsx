'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function GuestTripForm() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleGuestGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      if (data.isGuest) {
        localStorage.setItem('guestTrip', JSON.stringify(data))
        router.push('/trips/guest')
      } else {
        router.push(`/trips/${data._id}`)
      }
    } catch (error) {
      setErrorMsg('Failed to generate trip. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md pt-2 md:pt-4">
      <form onSubmit={handleGuestGenerate} className="flex flex-col gap-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A 5-day foodie trip to Tokyo..."
            className="w-full pl-5 pr-32 py-4 rounded-full border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white shadow-sm text-stone-800 placeholder-stone-400"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !prompt.trim()}
            className="absolute right-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-full hover:bg-amber-700 disabled:opacity-50 transition-all shadow-md flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ...
              </span>
            ) : (
              'Generate ✨'
            )}
          </button>
        </div>
        {errorMsg && <p className="text-sm text-red-500 pl-4">{errorMsg}</p>}
      </form>
      <p className="text-xs text-stone-500 mt-3 text-center lg:text-left pl-2">
        Try it for free. No account required.
      </p>
    </div>
  )
}