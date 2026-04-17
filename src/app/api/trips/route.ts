import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { generateTripPlan } from '@/lib/ai'

// GET /api/trips — get all trips for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const trips = await TripModel.find({ userId: (session.user as any).id })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(trips)
}

// POST /api/trips — create a new trip with AI-generated itinerary
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { destination, days, budgetType, interests } = body

    if (!destination || !days || !budgetType || !interests?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Call Claude to generate the plan
    const generated = await generateTripPlan({ destination, days, budgetType, interests })

    await connectDB()

    const trip = await TripModel.create({
      userId: (session.user as any).id,
      destination,
      days,
      budgetType,
      interests,
      itinerary: generated.itinerary,
      budget: generated.budget,
      hotels: generated.hotels,
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (err) {
    console.error('Create trip error:', err)
    return NextResponse.json({ error: 'Failed to generate trip' }, { status: 500 })
  }
}
