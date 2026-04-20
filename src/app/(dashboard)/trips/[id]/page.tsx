'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trip, DayPlan, Activity } from '@/types'

const TIER_STYLE = { budget: 'bg-green-50 text-green-700 border-green-200', mid: 'bg-blue-50 text-blue-700 border-blue-200', luxury: 'bg-purple-50 text-purple-700 border-purple-200' }
const TIER_LABEL = { budget: 'Budget friendly', mid: 'Mid range', luxury: 'Luxury' }

export default function TripPage() {
  const { id } = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Tab & Action States
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'hotels' | 'packing'>('itinerary')
  const [regenLoading, setRegenLoading] = useState<number | null>(null)
  const [regenText, setRegenText] = useState<Record<number, string>>({})

  // Swap States
  const [swapLoading, setSwapLoading] = useState<string | null>(null)
  const [alternatives, setAlternatives] = useState<Record<string, Activity[]>>({})

  const fetchTrip = useCallback(async () => {
    const res = await fetch(`/api/trips/${id}`)
    if (res.ok) setTrip(await res.json())
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
      return data
    }
    return null
  }

  async function toggleShare() {
    const data = await patch({ action: 'toggle_share' });
    if (data && data.isPublic) {
      navigator.clipboard.writeText(`${window.location.origin}/trip/share/${data.shareSlug}`);
      alert('Share link copied to clipboard!');
    }
  }

  async function getAlternatives(activityId: string, activityName: string) {
    if (alternatives[activityId]) {
      setAlternatives(prev => { const next = {...prev}; delete next[activityId]; return next; })
      return;
    }
    setSwapLoading(activityId);
    const res = await fetch(`/api/trips/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_alternatives', activityName }),
    });
    if (res.ok) {
      const data = await res.json();
      setAlternatives(prev => ({ ...prev, [activityId]: data.alternatives }));
    }
    setSwapLoading(null);
  }

  async function commitSwap(dayNumber: number, activityId: string, newActivity: Activity) {
    await patch({ action: 'commit_swap', dayNumber, activityId, newActivity });
    setAlternatives(prev => { const next = {...prev}; delete next[activityId]; return next; });
  }

  async function removeActivity(dayNumber: number, activityId: string) { await patch({ action: 'remove_activity', dayNumber, activityId }) }

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

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!trip) return <div className="p-8 text-center">Trip not found.</div>

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-amber-100 bg-white flex items-center justify-between">
        <div>
          <h1 className="page-title">{trip.destination}</h1>
          <p className="page-subtitle">{trip.days} days · {trip.vibe} · {trip.season}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleShare} className={`btn-secondary ${trip.isPublic ? 'bg-green-50 border-green-200 text-green-700' : ''}`}>
            {trip.isPublic ? '🔗 Shared (Click to copy)' : '🔒 Private (Click to share)'}
          </button>
          <button onClick={deleteTrip} disabled={deleteLoading} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
            {deleteLoading ? 'Deleting...' : 'Delete trip'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 flex gap-4 border-b border-amber-100 bg-white pt-2">
        {(['itinerary', 'budget', 'hotels', 'packing'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium capitalize border-b-2 transition-all ${activeTab === tab ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-amber-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        
        {/* Itinerary Tab */}
        {activeTab === 'itinerary' && (
          <div className="max-w-3xl space-y-6">
            {trip?.itinerary && trip.itinerary.length > 0 ? (
              trip.itinerary.map((dayPlan: DayPlan) => (
              <div key={dayPlan.day} className="card">
                <div className="mb-4 pb-3 border-b border-amber-50">
                  <div className="flex items-center justify-between">
                    <span className="font-lora font-semibold text-lg text-amber-900">Day {dayPlan.day}: {dayPlan.theme}</span>
                  </div>
                  {dayPlan.dailyTip && <p className="text-xs text-amber-600 mt-1">💡 {dayPlan.dailyTip}</p>}
                </div>

                <div className="space-y-2">
                  {dayPlan.activities.map((activity: Activity) => (
                    <div key={activity.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 group">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-stone-800">{activity.name} <span className="text-xs font-normal text-amber-600 ml-2">{activity.time} • {activity.costEstimate}</span></div>
                          <div className="text-xs text-stone-500 mt-1">{activity.notes}</div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => getAlternatives(activity.id, activity.name)} className="text-xs text-amber-600 hover:underline">
                            {swapLoading === activity.id ? 'Loading...' : 'Swap'}
                          </button>
                          <button onClick={() => removeActivity(dayPlan.day, activity.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                        </div>
                      </div>

                      {alternatives[activity.id] && (
                        <div className="mt-3 p-3 bg-white border border-amber-200 rounded-lg space-y-2">
                          <p className="text-xs font-semibold text-amber-800">Select an alternative:</p>
                          {alternatives[activity.id].map((alt, i) => (
                            <div key={i} className="flex justify-between items-center text-xs p-2 hover:bg-amber-50 rounded cursor-pointer" onClick={() => commitSwap(dayPlan.day, activity.id, alt)}>
                              <span><strong>{alt.name}</strong> ({alt.costEstimate}) - {alt.notes}</span>
                              <span className="text-amber-600 ml-2 border border-amber-300 px-2 py-1 rounded">Select</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 flex gap-2">
                  <input className="input-field text-xs py-2" placeholder={`Regenerate Day ${dayPlan.day}...`} value={regenText[dayPlan.day] || ''} onChange={e => setRegenText(prev => ({...prev, [dayPlan.day]: e.target.value}))} disabled={regenLoading === dayPlan.day} />
                  <button onClick={() => regenerateDay(dayPlan.day)} disabled={regenLoading === dayPlan.day} className="btn-secondary text-xs px-3 whitespace-nowrap flex items-center gap-1.5">
                    {regenLoading === dayPlan.day ? <><span className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full animate-spin" /> Regenerating...</> : <>↺ Regenerate</>}
                  </button>
                </div>
              </div>
            ))
            ) : (
              <div className="text-center py-12 text-stone-500">No itinerary data available. Please try refreshing the page.</div>
            )}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="max-w-md">
            <div className="card">
              <h3 className="font-lora text-base font-semibold text-amber-900 mb-4">Estimated trip cost</h3>
              <div className="space-y-0 divide-y divide-amber-50">
                {[
                  { label: 'Flights', value: trip.budget?.flights || 0 },
                  { label: 'Accommodation', value: trip.budget?.accommodation || 0 },
                  { label: 'Food', value: trip.budget?.food || 0 },
                  { label: 'Activities', value: trip.budget?.activities || 0 },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-3 text-sm">
                    <span className="text-stone-600">{row.label}</span>
                    <span className="text-amber-600 font-medium">${row.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 text-sm font-semibold">
                  <span className="text-amber-900">Total estimated</span>
                  <span className="text-amber-700 text-base">${(trip.budget?.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hotels Tab */}
        {activeTab === 'hotels' && (
          <div className="max-w-2xl">
            <div className="card space-y-0 divide-y divide-amber-50">
              {trip.hotels?.map((hotel, i) => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center text-2xl flex-shrink-0">
                    {hotel.tier === 'budget' ? '🏡' : hotel.tier === 'mid' ? '🏨' : '🏯'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-800">{hotel.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TIER_STYLE[hotel.tier as keyof typeof TIER_STYLE] || TIER_STYLE.mid}`}>
                        {TIER_LABEL[hotel.tier as keyof typeof TIER_LABEL] || 'Hotel'}
                      </span>
                    </div>
                    <div className="text-xs text-amber-600 mt-0.5">
                      {'★'.repeat(hotel.rating)}{'☆'.repeat(5 - hotel.rating)} · ${hotel.pricePerNight}/night
                    </div>
                    {hotel.description && <div className="text-xs text-amber-500 mt-0.5">{hotel.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packing Notes Tab */}
        {activeTab === 'packing' && (
          <div className="max-w-md card">
            <h3 className="font-lora font-semibold text-amber-900 mb-4">Packing & Prep for {trip.destination}</h3>
            <ul className="space-y-3">
              {trip.packingNotes?.map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="text-amber-500 mt-0.5">✓</span> {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}