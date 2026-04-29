import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { generateTripPlan } from '@/lib/ai'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  
  const trips = await TripModel.find({
    $or: [
      { userId: (session.user as any).id },
      { collaborators: session.user.email }
    ]
  })
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
    const { prompt, travelDate, budgetTier, interests } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const fullPrompt = `
User Request: ${prompt}
Travel Date: ${travelDate || 'Not specified'}
Budget Tier: ${budgetTier || 'Not specified'}
Interests: ${interests && interests.length > 0 ? interests.join(', ') : 'Not specified'}
    `.trim();

    const generated = await generateTripPlan(fullPrompt)
    
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
    
    const shareSlug = `${generated.metadata.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`

    await connectDB()

    const trip = await TripModel.create({
      userId: (session.user as any).id,
      promptUsed: prompt, 
      origin: generated.metadata.origin,
      destination: generated.metadata.destination,
      bestTimeToVisit: generated.metadata.bestTimeToVisit,
      days: generated.metadata.days,
      travelers: generated.metadata.travelers,
      season: generated.metadata.season,
      vibe: generated.metadata.vibe,
      budgetType: budgetTier || 'medium',
      interests: interests || [],
      itinerary: generated.itinerary,
      budget: generated.budget,
      hotels: generated.hotels,
      packingNotes: generated.packingNotes,
      isPublic: false,
      shareSlug: shareSlug
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (err: any) {
    console.error('Create trip error:', err)
    
    if (err.status === 503) {
      return NextResponse.json({ error: 'The AI service is currently experiencing high demand. Please try again later.' }, { status: 503 })
    }
    if (
      err.message?.includes('Your request could not be processed') || 
      err.message?.includes('The AI service returned an incompatible response') ||
      err.message?.includes('Malicious activity detected')
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to generate trip. Please try again.' }, { status: 500 })
  }
}