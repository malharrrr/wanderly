// src/app/api/trips/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { regenerateDay, getAlternativeActivities } from '@/lib/ai' // Updated import

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const trip = await TripModel.findOne({ _id: id, userId: (session.user as any).id }).lean()
  
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json(trip)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const trip = await TripModel.findOne({ _id: id, userId: (session.user as any).id })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { action, dayNumber, activityId, activityName, instruction, newActivity } = body

  // --- NEW: Toggle Share ---
  if (action === 'toggle_share') {
    const updatedTrip = await TripModel.findOneAndUpdate(
      { _id: id, userId: (session.user as any).id },
      { isPublic: !trip.isPublic },
      { new: true }
    )
    return NextResponse.json({ isPublic: updatedTrip?.isPublic, shareSlug: updatedTrip?.shareSlug });
  }

  // --- NEW: Get Alternatives (Does NOT save to DB, just returns data) ---
  if (action === 'get_alternatives') {
    try {
      const alternatives = await getAlternativeActivities(trip.destination, activityName);
      return NextResponse.json({ alternatives });
    } catch (e) {
      console.error('Get alternatives error:', e)
      if ((e as any).status === 503) {
        return NextResponse.json({ error: 'The AI service is currently experiencing high demand. Please try again later.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to get alternatives' }, { status: 500 });
    }
  }

  // --- NEW: Commit Swap ---
  if (action === 'commit_swap') {
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber);
    if (dayPlan) {
      const actIndex = dayPlan.activities.findIndex((a: any) => a.id === activityId);
      if (actIndex !== -1) {
        newActivity.id = `act_${dayNumber}_${Date.now()}`;
        dayPlan.activities[actIndex] = newActivity;
      }
    }
    const updatedTrip = await TripModel.findOneAndUpdate(
      { _id: id, userId: (session.user as any).id },
      { itinerary: trip.itinerary },
      { new: true }
    )
    return NextResponse.json(updatedTrip);
  }

  if (action === 'remove_activity') {
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
    if (dayPlan) dayPlan.activities = dayPlan.activities.filter((a: any) => a.id !== activityId)
    const updatedTrip = await TripModel.findOneAndUpdate(
      { _id: id, userId: (session.user as any).id },
      { itinerary: trip.itinerary },
      { new: true }
    )
    return NextResponse.json(updatedTrip);
  }

  if (action === 'add_activity') {
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
    if (dayPlan && activityName) {
      dayPlan.activities.push({ id: `act_${dayNumber}_${Date.now()}`, name: activityName, time: 'Flexible', duration: '', notes: '' })
    }
    const updatedTrip = await TripModel.findOneAndUpdate(
      { _id: id, userId: (session.user as any).id },
      { itinerary: trip.itinerary },
      { new: true }
    )
    return NextResponse.json(updatedTrip);
  }

  if (action === 'regenerate_day') {
    try {
      const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
      const currentActivities = dayPlan?.activities.map((a: any) => a.name) || []
      const newDay = await regenerateDay(trip.destination, dayNumber, currentActivities, instruction)
      const idx = trip.itinerary.findIndex((d: any) => d.day === dayNumber)
      if (idx !== -1) trip.itinerary[idx] = newDay
      const updatedTrip = await TripModel.findOneAndUpdate(
        { _id: id, userId: (session.user as any).id },
        { itinerary: trip.itinerary },
        { new: true }
      )
      return NextResponse.json(updatedTrip);
    } catch (err) {
      console.error('Regenerate day error:', err)
      if ((err as any).status === 503) {
        return NextResponse.json({ error: 'The AI service is currently experiencing high demand. Please try again later.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to regenerate day' }, { status: 500 });
    }
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const trip = await TripModel.findOneAndDelete({ _id: id, userId: (session.user as any).id })
  
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Trip deleted successfully' })
}