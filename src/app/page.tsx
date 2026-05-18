'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LandingPage() {
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
        sessionStorage.setItem('guestTrip', JSON.stringify(data))
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
    <div className="min-h-screen bg-cream-50 flex flex-col selection:bg-amber-200">
      <nav className="px-6 md:px-12 py-5 flex justify-between items-center border-b border-amber-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗺</span>
          <span className="font-lora text-xl font-bold text-amber-900 tracking-tight">Wanderly</span>
        </div>
        <div className="flex gap-3 md:gap-4 items-center">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-amber-900 hover:text-amber-700 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="text-xs md:text-sm font-medium bg-amber-600 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full hover:bg-amber-700 transition-all shadow-sm">
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-10 md:py-20 max-w-7xl mx-auto w-full gap-12 lg:gap-16">
        <div className="flex-1 max-w-2xl space-y-6 md:space-y-8 z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100/50 border border-amber-200 rounded-full text-[10px] md:text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Wanderly AI 2.0 is Live
          </div>
          
          <h1 className="font-lora text-4xl sm:text-5xl lg:text-7xl font-semibold text-stone-800 leading-tight">
            Plan your dream <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 italic pr-2">
              adventure
            </span> in seconds.
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-stone-600 leading-relaxed max-w-lg">
            Say goodbye to dozens of open browser tabs. Our multi-agent AI orchestrates your entire itinerary, fetching live weather and finding local secrets—all in one seamless dashboard.
          </p>

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
                  className="absolute right-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-full hover:bg-amber-700 disabled:opacity-50 transition-all shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Planning...
                    </span>
                  ) : (
                    'Generate ✨'
                  )}
                </button>
              </div>
              {errorMsg && <p className="text-sm text-red-500 pl-4">{errorMsg}</p>}
            </form>
            <p className="text-xs text-stone-500 mt-3 text-center lg:text-left pl-2">
              Try it for free. No credit card or account required.
            </p>
          </div>

          <div className="pt-8 flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-8 border-t border-amber-200/60 w-full">
            <div>
              <p className="text-xl sm:text-2xl font-lora font-bold text-amber-900">10+</p>
              <p className="text-[10px] sm:text-xs text-stone-500 font-medium uppercase tracking-wider">Trips Planned</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-amber-200/60"></div>
            <div>
              <p className="text-xl sm:text-2xl font-lora font-bold text-amber-900">100%</p>
              <p className="text-[10px] sm:text-xs text-stone-500 font-medium uppercase tracking-wider">AI Powered</p>
            </div>
            <div className="w-px h-8 sm:h-10 bg-amber-200/60 hidden sm:block"></div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-cream-50 bg-amber-200 flex items-center justify-center text-xs">👤</div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-md mx-auto lg:max-w-none mt-8 lg:mt-0 hidden lg:block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-200/40 rounded-full blur-3xl -z-10"></div>
          
          <div className="grid grid-cols-2 gap-3 md:gap-6 items-center">
            <div className="space-y-3 md:space-y-6 mt-6 lg:mt-12">
              <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl shadow-xl aspect-[4/5] border-2 md:border-4 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800" 
                  alt="Paris" 
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-white/90 backdrop-blur px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold text-amber-900">📍 Paris, France</div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl shadow-xl aspect-square border-2 md:border-4 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800" 
                  alt="Bali" 
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-white/90 backdrop-blur px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold text-amber-900">📍 Bali, Indonesia</div>
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-6 -mt-6 lg:-mt-12">
              <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl shadow-xl aspect-square border-2 md:border-4 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800" 
                  alt="Tokyo" 
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-white/90 backdrop-blur px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold text-amber-900">📍 Tokyo, Japan</div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl shadow-xl aspect-[4/5] border-2 md:border-4 border-white">
                <Image 
                  src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=800" 
                  alt="Ibiza" 
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-white/90 backdrop-blur px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold text-amber-900">📍 Ibiza, Spain</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}