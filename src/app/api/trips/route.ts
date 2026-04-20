import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { generateTripPlan } from '@/lib/ai'

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate the trip using the natural language prompt
    const generated = await generateTripPlan(prompt)
    
    // Normalize hotel tier values to valid enum values
    if (generated.hotels && Array.isArray(generated.hotels)) {
      generated.hotels = generated.hotels.map((hotel: any) => {
        const tierMap: { [key: string]: string } = {
          'mid-range': 'mid',
          'midrange': 'mid',
          'economy': 'budget',
          'premium': 'luxury',
          'deluxe': 'luxury',
          'high-end': 'luxury'
        }
        if (hotel.tier && tierMap[hotel.tier.toLowerCase()]) {
          hotel.tier = tierMap[hotel.tier.toLowerCase()]
        }
        return hotel
      })
    }
    
    // Create a unique slug for public sharing
    const shareSlug = `${generated.metadata.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`

    await connectDB()

    const trip = await TripModel.create({
      userId: (session.user as any).id,
      promptUsed: prompt,
      destination: generated.metadata.destination,
      days: generated.metadata.days,
      travelers: generated.metadata.travelers,
      season: generated.metadata.season,
      vibe: generated.metadata.vibe,
      budgetType: generated.metadata.budgetType,
      interests: generated.metadata.interests,
      itinerary: generated.itinerary,
      budget: generated.budget,
      hotels: generated.hotels,
      packingNotes: generated.packingNotes,
      isPublic: false,
      shareSlug: shareSlug
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (err) {
    console.error('Create trip error:', err)
    if ((err as any).status === 503) {
      return NextResponse.json({ error: 'The AI service is currently experiencing high demand. Please try again later.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to generate trip' }, { status: 500 })
  }
}