import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { notFound } from 'next/navigation'
import { DayPlan, Activity } from '@/types'

export default async function PublicTripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await connectDB()
  
  // Cast to 'any' to bypass strict Mongoose type inference
  const trip = (await TripModel.findOne({ shareSlug: slug, isPublic: true }).lean()) as any
  
  if (!trip) {
    notFound() 
  }

  return (
    <div className="min-h-screen bg-cream-50 py-12 px-4 font-source">
      <div className="max-w-3xl mx-auto">
        
        {/* Public Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            Shared Itinerary
          </div>
          <h1 className="text-5xl font-lora font-semibold text-amber-900 mb-4">{trip.destination}</h1>
          <p className="text-lg text-amber-700">
            {trip.days} Days • {trip.vibe} • {trip.season}
          </p>
        </div>

        {/* Itinerary Display */}
        <div className="space-y-8">
          {trip.itinerary.map((dayPlan: DayPlan) => (
            <div key={dayPlan.day} className="bg-white rounded-3xl border border-amber-200 p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="font-lora text-2xl font-semibold text-amber-900">
                  Day {dayPlan.day}: {dayPlan.theme}
                </h2>
                {dayPlan.dailyTip && (
                  <p className="text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-lg text-sm mt-3">
                    💡 {dayPlan.dailyTip}
                  </p>
                )}
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-amber-200 before:to-transparent">
                {dayPlan.activities.map((activity: Activity, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-400 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      📅
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-amber-100 bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-stone-800">{activity.name}</h3>
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">{activity.time}</span>
                      </div>
                      <p className="text-sm text-stone-600 mb-2">{activity.notes}</p>
                      <p className="text-xs text-stone-400 font-medium">Cost: {activity.costEstimate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Branding Footer */}
        <div className="mt-16 text-center border-t border-amber-200 pt-8">
          <p className="text-amber-800 font-medium">Planned with Wanderly</p>
          <p className="text-sm text-amber-600 mt-1">Build your own AI travel itinerary in seconds.</p>
        </div>

      </div>
    </div>
  )
}