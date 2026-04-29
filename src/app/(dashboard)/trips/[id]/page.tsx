'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trip, DayPlan, Activity, WeatherLocationForecast } from '@/types'
import { getPusherClient } from '@/lib/pusher-client'

const TIER_STYLE = { budget: 'bg-green-50 text-green-700 border-green-200', mid: 'bg-blue-50 text-blue-700 border-blue-200', luxury: 'bg-purple-50 text-purple-700 border-purple-200' }
const TIER_LABEL = { budget: 'Budget friendly', mid: 'Mid range', luxury: 'Luxury' }

export default function TripPage() {
  const { id } = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  // Weather states
  const [weatherData, setWeatherData] = useState<WeatherLocationForecast[] | string | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [activeWeatherLoc, setActiveWeatherLoc] = useState<number>(0)
  // Tab & Action States
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'hotels' | 'packing' | 'weather' | 'polls' | 'splitwise'>('itinerary')
  const [regenLoading, setRegenLoading] = useState<number | null>(null)
  const [regenText, setRegenText] = useState<Record<number, string>>({})
  const [swapLoading, setSwapLoading] = useState<string | null>(null)
  const [alternatives, setAlternatives] = useState<Record<string, Activity[]>>({})
  // Collaboration States
  const [inviteEmail, setInviteEmail] = useState('')
  const [newPollQ, setNewPollQ] = useState('')
  const [newPollOpts, setNewPollOpts] = useState(['', ''])
  const [newExpDesc, setNewExpDesc] = useState('')
  const [newExpAmt, setNewExpAmt] = useState('')

  const fetchTrip = useCallback(async (isBackgroundSync = false) => {
    const res = await fetch(`/api/trips/${id}`)
    if (res.ok) {
      const data = await res.json()
      setTrip(data)

      if (!isBackgroundSync && data.destination && data.season) {
        setWeatherLoading(true)
        fetch(`/api/weather?destinations=${encodeURIComponent(data.destination)}&season=${encodeURIComponent(data.season)}`)
          .then(res => res.json())
          .then(wData => setWeatherData(wData.weather))
          .catch(() => setWeatherData('Weather data unavailable.'))
          .finally(() => setWeatherLoading(false))
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { 
    fetchTrip() 

    const pusher = getPusherClient()
    if (!pusher) return 

    const channel = pusher.subscribe(`trip-${id}`)

    channel.bind('trip-updated', () => {
      fetchTrip(true) 
    })

    return () => {
      pusher.unsubscribe(`trip-${id}`)
      pusher.disconnect()
    }
  }, [fetchTrip, id])

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

  async function addCollaborator() {
    if (!inviteEmail) return
    await patch({ action: 'add_collaborator', email: inviteEmail })
    setInviteEmail('')
    alert('Collaborator added!')
  }

  async function createPoll() {
    if (!newPollQ || newPollOpts.some(o => !o)) return
    await patch({ action: 'create_poll', question: newPollQ, options: newPollOpts.filter(o => o.trim() !== '') })
    setNewPollQ(''); setNewPollOpts(['', ''])
  }

  async function votePoll(pollId: string, optionId: string) {
    await patch({ action: 'vote_poll', pollId, optionId })
  }

  async function addExpense() {
    if (!newExpDesc || !newExpAmt) return
    await patch({ action: 'add_expense', description: newExpDesc, amount: Number(newExpAmt) })
    setNewExpDesc(''); setNewExpAmt('')
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

  async function removeActivity(dayNumber: number, activityId: string) { 
    await patch({ action: 'remove_activity', dayNumber, activityId }) 
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

  if (loading) return <div className="p-8 text-center">Loading Trip...</div>
  if (!trip) return <div className="p-8 text-center">Trip not found.</div>

  const headerWeatherString = Array.isArray(weatherData) 
    ? weatherData.map(w => w.summary).join('  |  ')
    : typeof weatherData === 'string' 
      ? weatherData 
      : 'Weather data unavailable.';

  const totalExpenses = trip.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalPeople = (trip.collaborators?.length || 0) + 1;

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <div className="px-8 py-5 border-b border-amber-100 bg-white flex flex-col gap-4 shadow-sm z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">{trip.destination}</h1>
              <span className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold" title="Owner">👑</div>
                {trip.collaborators?.map((email, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-sky-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold" title={email}>{email[0].toUpperCase()}</div>
                ))}
              </span>
            </div>
            <p className="page-subtitle mb-2">{trip.days} days · {trip.vibe} · {trip.season}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="friend@email.com" className="px-3 py-2 text-sm outline-none bg-transparent w-40 placeholder:text-amber-300" />
              <button onClick={addCollaborator} className="px-3 py-2 bg-amber-200 text-amber-900 text-sm font-medium hover:bg-amber-300">Invite</button>
            </div>
            <button onClick={toggleShare} className={`btn-secondary ${trip.isPublic ? 'bg-green-50 border-green-200 text-green-700' : ''}`}>
              {trip.isPublic ? '🔗 Shared Link' : '🔒 Private'}
            </button>
            <button onClick={deleteTrip} disabled={deleteLoading} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50">
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trip.bestTimeToVisit && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
              🗓 {trip.bestTimeToVisit}
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 border border-sky-100 rounded-lg text-xs text-sky-800">
            {weatherLoading ? <span className="animate-pulse">Fetching weather...</span> : <span>{headerWeatherString}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 flex gap-4 border-b border-amber-100 bg-white pt-2 overflow-x-auto shrink-0">
        {(['itinerary', 'budget', 'hotels', 'packing', 'weather', 'polls', 'splitwise'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`pb-3 text-sm font-medium capitalize border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-amber-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'itinerary' && (
          <div className="max-w-3xl space-y-6">
            {trip?.itinerary && trip.itinerary.length > 0 ? (
              trip.itinerary.map((dayPlan: DayPlan) => (
                <div key={dayPlan.day} className="card">
                  <div className="mb-4 pb-3 border-b border-amber-50 flex justify-between">
                    <span className="font-lora font-semibold text-lg text-amber-900">Day {dayPlan.day}: {dayPlan.theme}</span>
                  </div>
                  {dayPlan.dailyTip && <p className="text-xs text-amber-600 mb-3">💡 {dayPlan.dailyTip}</p>}

                  <div className="space-y-2">
                    {dayPlan.activities.map((act: Activity) => (
                      <div key={act.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 group">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-stone-800">{act.name} <span className="text-xs font-normal text-amber-600 ml-2">{act.time} • {act.costEstimate}</span></div>
                            <div className="text-xs text-stone-500 mt-1">{act.notes}</div>
                          </div>
                          
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => getAlternatives(act.id, act.name)} className="text-xs text-amber-600 hover:underline">
                              {swapLoading === act.id ? 'Loading...' : 'Swap'}
                            </button>
                            <button onClick={() => removeActivity(dayPlan.day, act.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                          </div>
                        </div>

                        {alternatives[act.id] && (
                          <div className="mt-3 p-3 bg-white border border-amber-200 rounded-lg space-y-2">
                            <p className="text-xs font-semibold text-amber-800">Select an alternative:</p>
                            {alternatives[act.id].map((alt, i) => (
                              <div key={i} className="flex justify-between items-center text-xs p-2 hover:bg-amber-50 rounded cursor-pointer" onClick={() => commitSwap(dayPlan.day, act.id, alt)}>
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
              <div className="text-center py-12 text-stone-500">No itinerary data available.</div>
            )}
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="max-w-2xl space-y-6">
            <div className="card bg-amber-50 border-amber-200">
              <h3 className="font-lora font-semibold text-amber-900 mb-3">Ask the Group</h3>
              <input value={newPollQ} onChange={e => setNewPollQ(e.target.value)} placeholder="e.g., Which days should we go to Tokyo?" className="input-field mb-3 bg-white" />
              {newPollOpts.map((opt, i) => (
                <input key={i} value={opt} onChange={e => { const newO = [...newPollOpts]; newO[i] = e.target.value; setNewPollOpts(newO) }} placeholder={`Option ${i + 1}`} className="input-field mb-2 text-sm py-2 bg-white" />
              ))}
              <div className="flex justify-between items-center mt-2">
                <button onClick={() => setNewPollOpts([...newPollOpts, ''])} className="text-xs text-amber-600 font-medium">+ Add Option</button>
                <button onClick={createPoll} className="btn-primary py-2 px-4 text-xs shadow-sm hover:shadow">Create Poll</button>
              </div>
            </div>

            {trip.polls?.length === 0 && (
              <div className="text-center text-sm text-stone-400 py-8">No polls created yet.</div>
            )}

            {trip.polls?.map((poll: any) => (
              <div key={poll._id} className="card border-stone-200 shadow-sm">
                <p className="text-xs text-stone-400 mb-1">Asked by {poll.createdBy}</p>
                <h4 className="font-medium text-stone-800 mb-4 text-lg">{poll.question}</h4>
                <div className="space-y-3">
                  {poll.options.map((opt: any) => {
                    const totalVotes = poll.options.reduce((sum: number, o: any) => sum + o.votes.length, 0);
                    const percent = totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 100);
                    return (
                      <div key={opt._id} onClick={() => votePoll(poll._id, opt._id)} className="relative overflow-hidden rounded-xl border border-stone-200 p-3.5 cursor-pointer hover:border-amber-400 transition-all bg-white group">
                        <div className="absolute top-0 left-0 h-full bg-amber-100/60 transition-all duration-700 ease-out z-0" style={{ width: `${percent}%` }}></div>
                        <div className="flex justify-between items-center text-sm relative z-10">
                          <span className="font-medium text-stone-800 group-hover:text-amber-900 transition-colors">{opt.text}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5 mr-2">
                              {opt.votes.slice(0, 3).map((voter: string, vIndex: number) => (
                                <div key={vIndex} className="w-5 h-5 rounded-full bg-stone-300 border border-white flex items-center justify-center text-[9px] text-stone-700 font-bold" title={voter}>
                                  {voter[0].toUpperCase()}
                                </div>
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-stone-600">{percent}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'splitwise' && (
          <div className="max-w-2xl space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-green-50 border-green-200 text-center shadow-sm">
                <p className="text-sm font-medium text-green-800">Total Group Spend</p>
                <p className="text-4xl font-lora font-bold text-green-900 mt-2">${totalExpenses.toFixed(2)}</p>
              </div>
              <div className="card bg-amber-50 border-amber-200 text-center shadow-sm">
                <p className="text-sm font-medium text-amber-800">Per Person (Est.)</p>
                <p className="text-4xl font-lora font-bold text-amber-900 mt-2">
                  ${(totalExpenses / totalPeople).toFixed(2)}
                </p>
                <p className="text-xs text-amber-700 mt-1">Split among {totalPeople} people</p>
              </div>
            </div>

            <div className="card border-stone-200 flex gap-3 items-center shadow-sm p-4 bg-white">
              <div className="flex-1">
                <input value={newExpDesc} onChange={e => setNewExpDesc(e.target.value)} placeholder="What did you pay for? (e.g., Dinner)" className="input-field bg-stone-50" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                <input value={newExpAmt} onChange={e => setNewExpAmt(e.target.value)} type="number" placeholder="0.00" className="input-field pl-7 w-28 bg-stone-50" />
              </div>
              <button onClick={addExpense} className="btn-primary py-2.5 px-6 shadow-sm hover:shadow whitespace-nowrap">Add Expense</button>
            </div>

            <div className="space-y-0 divide-y divide-stone-100 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              {trip.expenses?.slice().reverse().map((exp: any) => (
                <div key={exp._id} className="p-4 flex justify-between items-center hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cream-100 border border-amber-100 flex items-center justify-center text-lg shadow-inner">💸</div>
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{exp.description}</p>
                      <p className="text-xs text-stone-500 mt-0.5">Paid by <span className="font-semibold text-stone-700">{exp.paidBy}</span> on {new Date(exp.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-stone-800">${exp.amount.toFixed(2)}</span>
                </div>
              ))}
              {(!trip.expenses || trip.expenses.length === 0) && (
                <div className="p-10 text-center text-stone-400 text-sm">No expenses tracked yet. Add your first transaction above!</div>
              )}
            </div>
          </div>
        )}
\
        {activeTab === 'budget' && (
          <div className="max-w-md space-y-6">
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

        {activeTab === 'weather' && (
          <div className="max-w-4xl">
            <h3 className="font-lora font-semibold text-xl text-amber-900 mb-6">Live Forecasts</h3>
            
            {weatherLoading ? (
              <div className="p-8 text-center text-stone-500">Loading multi-city forecasts...</div>
            ) : Array.isArray(weatherData) && weatherData.length > 0 ? (
              <>
                {weatherData.length > 1 && (
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {weatherData.map((loc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveWeatherLoc(idx)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border ${activeWeatherLoc === idx ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-sm' : 'bg-white border-amber-100 text-stone-500 hover:bg-amber-50'}`}
                      >
                        📍 {loc.location}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {weatherData[activeWeatherLoc].daily.map((day, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex flex-col items-center text-center ${i === 0 ? 'bg-sky-50 border-sky-200' : 'bg-white border-amber-100'}`}>
                      <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">{i === 0 ? 'Today' : day.date}</div>
                      <div className="text-3xl mb-3">{day.description.split(' ')[0]}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-stone-800">{day.maxTemp}°</span>
                        <span className="text-xs text-stone-400">{day.minTemp}°</span>
                      </div>
                      <div className="text-xs text-stone-500 mt-2 leading-tight">{day.description.substring(day.description.indexOf(' ') + 1)}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-stone-500 bg-white rounded-2xl border border-amber-100">
                Detailed forecast is currently unavailable for these destinations.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}