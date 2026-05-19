import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import TripClient from './TripClient'

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'guest') {
    return <TripClient tripId="guest" isGuest={true} initialTrip={null} />
  }

  const session = await getServerSession(authOptions)
  if (!session) return null 

  await connectDB()
  const tripDoc = await TripModel.findById(id).lean()
  
  if (!tripDoc) {
    return <div className="p-8 text-center text-stone-500 min-h-screen flex items-center justify-center">Trip not found.</div>
  }
  const initialTrip = JSON.parse(JSON.stringify(tripDoc))

  return <TripClient tripId={id} isGuest={false} initialTrip={initialTrip} />
}