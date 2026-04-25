import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  // if the user is already logged in, securely route them to the dashboard
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col selection:bg-amber-200">
      
      <nav className="px-6 md:px-12 py-6 flex justify-between items-center border-b border-amber-200/50 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗺</span>
          <span className="font-lora text-xl font-bold text-amber-900 tracking-tight">Wanderly</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm font-medium text-amber-900 hover:text-amber-700 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-medium bg-amber-600 text-white px-5 py-2.5 rounded-full hover:bg-amber-700 transition-all shadow-sm hover:shadow-md">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto w-full gap-12">
        
        <div className="flex-1 max-w-2xl space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100/50 border border-amber-200 rounded-full text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Wanderly AI 1.0 is Live
          </div>
          
          <h1 className="font-lora text-5xl md:text-6xl lg:text-7xl font-semibold text-stone-800 leading-tight">
            Plan your dream <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800 italic pr-2">
              adventure
            </span> in seconds.
          </h1>
          
          <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-lg">
            Say goodbye to dozens of open browser tabs. Our multi-agent AI orchestrates your entire itinerary, fetching live weather and finding local secrets—all in one seamless dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/register" className="inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-white bg-amber-600 rounded-full hover:bg-amber-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Start Planning Free ✨
            </Link>
            <Link href="/login" className="inline-flex justify-center items-center px-8 py-4 text-base font-medium text-amber-900 bg-white border border-amber-200 rounded-full hover:bg-amber-50 transition-all">
              View Sample Trips
            </Link>
          </div>

          <div className="pt-8 flex items-center gap-8 border-t border-amber-200/60">
            <div>
              <p className="text-2xl font-lora font-bold text-amber-900">10+</p>
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Trips Planned</p>
            </div>
            <div className="w-px h-10 bg-amber-200/60"></div>
            <div>
              <p className="text-2xl font-lora font-bold text-amber-900">100%</p>
              <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">AI Powered</p>
            </div>
            <div className="w-px h-10 bg-amber-200/60"></div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-cream-50 bg-amber-200 flex items-center justify-center text-xs">👤</div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-200/40 rounded-full blur-3xl -z-10"></div>
          
          <div className="grid grid-cols-2 gap-4 md:gap-6 items-center">
            <div className="space-y-4 md:space-y-6 mt-12">
              <div className="relative group overflow-hidden rounded-3xl shadow-xl aspect-[4/5] border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800" 
                  alt="Paris" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-amber-900">📍 Paris, France</div>
              </div>
              <div className="relative group overflow-hidden rounded-3xl shadow-xl aspect-square border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800" 
                  alt="Bali" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-amber-900">📍 Bali, Indonesia</div>
              </div>
            </div>
            
            <div className="space-y-4 md:space-y-6 -mt-12">
              <div className="relative group overflow-hidden rounded-3xl shadow-xl aspect-square border-4 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800" 
                  alt="Tokyo" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-amber-900">📍 Tokyo, Japan</div>
              </div>
                <div className="relative group overflow-hidden rounded-3xl shadow-xl aspect-[4/5] border-4 border-white">
                  <img 
                    src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=800" 
                    alt="Ibiza" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-amber-900">📍 Ibiza, Spain</div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}