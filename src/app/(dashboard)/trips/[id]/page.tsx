'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trip, DayPlan, Activity } from '@/types'

const BUDGET_LABEL = { low: 'Budget', medium: 'Mid-range', high: 'Luxury' }
const TIER_STYLE = {
  budget: 'bg-green-50 text-green-700 border-green-200',
  mid: 'bg-blue-50 text-blue-700 border-blue-200',
  luxury: 'bg-purple-50 text-purple-700 border-purple-200',
}
const TIER_LABEL = { budget: 'Budget friendly', mid: 'Mid range', luxury: 'Luxury' }

export default function TripPage() {
  const { id } = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenLoading, setRegenLoading] = useState<number | null>(null)
  const [regenText, setRegenText] = useState<Record<number, string>>({})
  const [addText, setAddText] = useState<Record<number, string>>({})
  const [showAddInput, setShowAddInput] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'hotels'>('itinerary')

  const fetchTrip = useCallback(async () => {
    const res = await fetch(`/api/trips/${id}`)
    if (res.ok) {
      const data = await res.json()
      setTrip(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchTrip() }, [fetchTrip])

  async function patch(body: object) {
    const res = await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setTrip(data)
    }
  }

  async function removeActivity(dayNumber: number, activityId: string) {
    await patch({ action: 'remove_activity', dayNumber, activityId })
  }

  async function addActivity(dayNumber: number) {
    const text = addText[dayNumber]?.trim()
    if (!text) return
    await patch({ action: 'add_activity', dayNumber, activityName: text })
    setAddText(prev => ({ ...prev, [dayNumber]: '' }))
    setShowAddInput(null)
  }

  async function regenerateDay(dayNumber: number) {
    const instruction = regenText[dayNumber]?.trim() || 'Regenerate with similar activities'
    setRegenLoading(dayNumber)
    await patch({ action: 'regenerate_day', dayNumber, instruction })
    setRegenLoading(null)
    setRegenText(prev => ({ ...prev, [dayNumber]: '' }))
  }

  async function deleteTrip() {
    if (!confirm('Delete this trip? This cannot be undone.')) return
    setDeleteLoading(true)
    await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-amber-700">Loading your trip...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-amber-700">Trip not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="px-8 py-5 border-b border-amber-100 bg-white flex items-center justify-between">
        <div>
          <h1 className="page-title">{trip.destination}</h1>
          <p className="page-subtitle">
            {trip.days} days · {BUDGET_LABEL[trip.budgetType as keyof typeof BUDGET_LABEL]} · {trip.interests.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={deleteTrip}
            disabled={deleteLoading}
            className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
          >
            {deleteLoading ? 'Deleting...' : 'Delete trip'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 flex gap-1 border-b border-amber-100 bg-white">
        {(['itinerary', 'budget', 'hotels'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-amber-400 hover:text-amber-600'
            }`}
          >
            {tab === 'itinerary' ? '📅 Itinerary' : tab === 'budget' ? '💰 Budget' : '🏨 Hotels'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ITINERARY TAB */}
        {activeTab === 'itinerary' && (
          <div className="max-w-3xl space-y-4">
            {trip.itinerary.map((dayPlan: DayPlan) => (
              <div key={dayPlan.day} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full">
                    Day {dayPlan.day}
                  </span>
                  <span className="text-xs text-amber-500">{dayPlan.activities.length} activities</span>
                </div>

                {/* Activities */}
                <div className="space-y-0 divide-y divide-amber-50">
                  {dayPlan.activities.map((activity: Activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-3 group">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-stone-800">{activity.name}</div>
                        {(activity.time || activity.duration) && (
                          <div className="text-xs text-amber-600 mt-0.5">
                            {activity.time}{activity.time && activity.duration ? ' · ' : ''}{activity.duration}
                          </div>
                        )}
                        {activity.notes && (
                          <div className="text-xs text-amber-500 mt-0.5 italic">{activity.notes}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeActivity(dayPlan.day, activity.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-amber-300 hover:text-red-400 transition-all px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add activity */}
                {showAddInput === dayPlan.day ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      className="input-field flex-1 text-sm"
                      placeholder="Add an activity..."
                      value={addText[dayPlan.day] || ''}
                      onChange={e => setAddText(prev => ({ ...prev, [dayPlan.day]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addActivity(dayPlan.day)}
                      autoFocus
                    />
                    <button onClick={() => addActivity(dayPlan.day)} className="btn-primary px-3 py-1.5 text-xs">Add</button>
                    <button onClick={() => setShowAddInput(null)} className="btn-secondary px-3 py-1.5 text-xs">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddInput(dayPlan.day)}
                    className="mt-2 text-xs text-amber-500 hover:text-amber-700 transition-colors"
                  >
                    + Add activity
                  </button>
                )}

                {/* Regenerate day */}
                <div className="mt-3 pt-3 border-t border-amber-50">
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1 text-xs py-2"
                      placeholder={`e.g. "More outdoor activities for Day ${dayPlan.day}"`}
                      value={regenText[dayPlan.day] || ''}
                      onChange={e => setRegenText(prev => ({ ...prev, [dayPlan.day]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && regenerateDay(dayPlan.day)}
                      disabled={regenLoading === dayPlan.day}
                    />
                    <button
                      onClick={() => regenerateDay(dayPlan.day)}
                      disabled={regenLoading === dayPlan.day}
                      className="btn-secondary text-xs px-3 whitespace-nowrap flex items-center gap-1.5"
                    >
                      {regenLoading === dayPlan.day ? (
                        <><span className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full animate-spin" /> Regenerating...</>
                      ) : (
                        <>↺ Regenerate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === 'budget' && (
          <div className="max-w-md">
            <div className="card">
              <h3 className="font-lora text-base font-semibold text-amber-900 mb-4">Estimated trip cost</h3>
              <div className="space-y-0 divide-y divide-amber-50">
                {[
                  { label: 'Flights', value: trip.budget.flights },
                  { label: 'Accommodation', value: trip.budget.accommodation },
                  { label: 'Food', value: trip.budget.food },
                  { label: 'Activities', value: trip.budget.activities },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-3 text-sm">
                    <span className="text-stone-600">{row.label}</span>
                    <span className="text-amber-600 font-medium">${row.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 text-sm font-semibold">
                  <span className="text-amber-900">Total estimated</span>
                  <span className="text-amber-700 text-base">${trip.budget.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-xs font-semibold text-amber-700 mb-1">💡 Note</div>
              <div className="text-xs text-amber-700 leading-relaxed">
                These are AI-estimated figures for a {trip.budgetType} trip to {trip.destination} over {trip.days} days.
                Actual costs may vary based on season, booking time, and personal choices.
              </div>
            </div>
          </div>
        )}

        {/* HOTELS TAB */}
        {activeTab === 'hotels' && (
          <div className="max-w-2xl">
            <div className="card space-y-0 divide-y divide-amber-50">
              {trip.hotels.map((hotel, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center text-2xl flex-shrink-0">
                    {hotel.tier === 'budget' ? '🏡' : hotel.tier === 'mid' ? '🏨' : '🏯'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-800">{hotel.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TIER_STYLE[hotel.tier as keyof typeof TIER_STYLE]}`}>
                        {TIER_LABEL[hotel.tier as keyof typeof TIER_LABEL]}
                      </span>
                    </div>
                    <div className="text-xs text-amber-600 mt-0.5">
                      {'★'.repeat(hotel.rating)}{'☆'.repeat(5 - hotel.rating)} · ${hotel.pricePerNight}/night
                    </div>
                    {hotel.description && (
                      <div className="text-xs text-amber-500 mt-0.5">{hotel.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-xs font-semibold text-amber-700 mb-1">🤖 AI recommendation</div>
              <div className="text-xs text-amber-700 leading-relaxed">
                For a {trip.budgetType} trip to {trip.destination}, the{' '}
                <strong>{trip.hotels.find(h => h.tier === (trip.budgetType === 'low' ? 'budget' : trip.budgetType === 'high' ? 'luxury' : 'mid'))?.name}</strong>{' '}
                is your best fit based on your budget and interests ({trip.interests.slice(0, 2).join(', ')}).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
