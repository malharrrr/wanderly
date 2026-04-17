import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import Link from 'next/link'

const EMOJI_MAP: Record<string, string> = {
  default: '🌍',
  japan: '⛩️', tokyo: '⛩️', kyoto: '⛩️', osaka: '🏯',
  france: '🗼', paris: '🗼',
  italy: '🏛️', rome: '🏛️', venice: '🚢',
  usa: '🗽', 'new york': '🗽', 'new york city': '🗽',
  bali: '🌴', thailand: '🌴', beach: '🌴',
  india: '🕌', london: '🎡', spain: '💃',
}

function getEmoji(destination: string) {
  const lower = destination.toLowerCase()
  for (const key of Object.keys(EMOJI_MAP)) {
    if (lower.includes(key)) return EMOJI_MAP[key]
  }
  return EMOJI_MAP.default
}

const BUDGET_LABEL = { low: 'Budget', medium: 'Mid-range', high: 'Luxury' }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  await connectDB()

  const trips = (await TripModel.find({ userId: (session!.user as any).id })
    .sort({ createdAt: -1 })
    .lean()) as any[]

  const destinations = new Set(trips.map(t => t.destination.split(',').pop()?.trim() || '')).size
  const totalDays = trips.reduce((sum, t) => sum + t.days, 0)
  const firstName = session!.user!.name?.split(' ')[0] || 'Traveller'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-amber-100 flex items-center justify-between bg-white">
        <div>
          <h1 className="page-title">{greeting}, {firstName} 👋</h1>
          <p className="page-subtitle">Ready to plan your next adventure?</p>
        </div>
        <Link href="/plan" className="btn-primary">✨ New trip</Link>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-cream-100 rounded-2xl border border-amber-200 p-5">
            <div className="text-xs text-amber-700 font-medium uppercase tracking-wider">Trips planned</div>
            <div className="text-4xl font-lora font-semibold text-amber-900 mt-1">{trips.length}</div>
          </div>
          <div className="bg-cream-100 rounded-2xl border border-amber-200 p-5">
            <div className="text-xs text-amber-700 font-medium uppercase tracking-wider">Destinations</div>
            <div className="text-4xl font-lora font-semibold text-amber-900 mt-1">{destinations}</div>
          </div>
          <div className="bg-cream-100 rounded-2xl border border-amber-200 p-5">
            <div className="text-xs text-amber-700 font-medium uppercase tracking-wider">Days planned</div>
            <div className="text-4xl font-lora font-semibold text-amber-900 mt-1">{totalDays}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-lora text-lg font-semibold text-amber-900">My trips</h2>
          {trips.length > 0 && (
            <Link href="/trips" className="text-sm text-amber-600 hover:underline">View all</Link>
          )}
        </div>

        {trips.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🧳</div>
            <h3 className="font-lora text-lg font-semibold text-amber-900 mb-2">No trips yet</h3>
            <p className="text-sm text-amber-700 mb-6">Let AI plan your perfect itinerary in seconds</p>
            <Link href="/plan" className="btn-primary inline-block">Plan your first trip ✨</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {trips.slice(0, 5).map(trip => (
              <Link key={trip._id.toString()} href={`/trips/${trip._id}`}>
                <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="h-24 bg-cream-200 flex items-center justify-center text-4xl">
                    {getEmoji(trip.destination)}
                  </div>
                  <div className="p-4">
                    <div className="font-medium text-amber-900 text-sm truncate">{trip.destination}</div>
                    <div className="text-xs text-amber-700 mt-1">
                      {trip.days} days · {BUDGET_LABEL[trip.budgetType as keyof typeof BUDGET_LABEL]}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/plan">
              <div className="bg-amber-50 rounded-2xl border border-dashed border-amber-300 flex items-center justify-center min-h-[140px] hover:bg-amber-100 transition-all cursor-pointer">
                <div className="text-center">
                  <div className="text-2xl text-amber-300 mb-1">＋</div>
                  <div className="text-xs text-amber-600 font-medium">Plan new trip</div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}