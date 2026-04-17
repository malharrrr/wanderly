import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { regenerateDay } from '@/lib/ai'

// GET /api/trips/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const trip = await TripModel.findOne({ _id: params.id, userId: (session.user as any).id }).lean()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(trip)
}

// PATCH /api/trips/[id] — edit itinerary (add/remove activity, regenerate day)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const trip = await TripModel.findOne({ _id: params.id, userId: (session.user as any).id })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { action, dayNumber, activityId, activityName, instruction } = body

  if (action === 'remove_activity') {
    // Remove a specific activity from a day
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
    if (dayPlan) {
      dayPlan.activities = dayPlan.activities.filter((a: any) => a.id !== activityId)
    }
  }

  if (action === 'add_activity') {
    // Add a new activity to a day
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
    if (dayPlan && activityName) {
      dayPlan.activities.push({
        id: `act_${dayNumber}_${Date.now()}`,
        name: activityName,
        time: 'Flexible',
        duration: '',
        notes: '',
      })
    }
  }

  if (action === 'regenerate_day') {
    // Use AI to regenerate a specific day
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
    const currentActivities = dayPlan?.activities.map((a: any) => a.name) || []
    const newDay = await regenerateDay(trip.destination, dayNumber, currentActivities, instruction)
    const idx = trip.itinerary.findIndex((d: any) => d.day === dayNumber)
    if (idx !== -1) trip.itinerary[idx] = newDay
  }

  trip.markModified('itinerary')
  await trip.save()

  return NextResponse.json(trip)
}

// DELETE /api/trips/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await TripModel.deleteOne({ _id: params.id, userId: (session.user as any).id })
  return NextResponse.json({ success: true })
}
