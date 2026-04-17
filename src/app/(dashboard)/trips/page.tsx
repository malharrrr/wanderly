import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import Link from 'next/link'

const EMOJI_MAP: Record<string, string> = {
  default: '🌍', japan: '⛩️', tokyo: '⛩️', kyoto: '⛩️', osaka: '🏯',
  france: '🗼', paris: '🗼', italy: '🏛️', rome: '🏛️',
  'new york': '🗽', bali: '🌴', thailand: '🌴', india: '🕌',
  london: '🎡', spain: '💃',
}

function getEmoji(d: string) {
  const l = d.toLowerCase()
  for (const key of Object.keys(EMOJI_MAP)) {
    if (l.includes(key)) return EMOJI_MAP[key]
  }
  return EMOJI_MAP.default
}

const BUDGET_LABEL = { low: 'Budget', medium: 'Mid-range', high: 'Luxury' }

export default async function TripsPage() {
  const session = await getServerSession(authOptions)
  await connectDB()

  const trips = (await TripModel.find({ userId: (session!.user as any).id })
    .sort({ createdAt: -1 })
    .lean()) as any[]

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-amber-100 bg-white flex items-center justify-between">
        <div>
          <h1 className="page-title">My trips</h1>
          <p className="page-subtitle">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</p>
        </div>
        <Link href="/plan" className="btn-primary">✨ New trip</Link>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {trips.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🧳</div>
            <h3 className="font-lora text-lg font-semibold text-amber-900 mb-2">No trips yet</h3>
            <p className="text-sm text-amber-700 mb-6">Generate your first AI itinerary in seconds</p>
            <Link href="/plan" className="btn-primary inline-block">Plan your first trip ✨</Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {trips.map(trip => (
              <Link key={trip._id.toString()} href={`/trips/${trip._id}`}>
                <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="h-28 bg-cream-200 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-200">
                    {getEmoji(trip.destination)}
                  </div>
                  <div className="p-4">
                    <div className="font-lora font-semibold text-amber-900 truncate">{trip.destination}</div>
                    <div className="text-xs text-amber-700 mt-1">
                      {trip.days} days · {BUDGET_LABEL[trip.budgetType as keyof typeof BUDGET_LABEL]}
                    </div>
                    <div className="text-xs text-amber-400 mt-1">
                      {new Date(trip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}