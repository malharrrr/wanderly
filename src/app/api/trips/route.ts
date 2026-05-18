import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { generateTripPlan } from '@/lib/ai'
import { guestGenerationRateLimit } from '@/lib/ratelimit'

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

  try {
    const body = await req.json()
    const { prompt, travelDate, budgetTier, interests, isSavingGuestTrip, guestTripData } = body
    if (session?.user && isSavingGuestTrip && guestTripData) {
      const shareSlug = `${guestTripData.metadata?.destination?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'trip'}-${Math.random().toString(36).substring(2, 8)}`
      
      await connectDB()
      
      const trip = await TripModel.create({
        userId: (session.user as any).id,
        promptUsed: prompt || "Guest Generation", 
        origin: guestTripData.metadata?.origin,
        destination: guestTripData.metadata?.destination,
        bestTimeToVisit: guestTripData.metadata?.bestTimeToVisit,
        days: guestTripData.metadata?.days,
        travelers: guestTripData.metadata?.travelers,
        season: guestTripData.metadata?.season,
        vibe: guestTripData.metadata?.vibe,
        budgetType: budgetTier || 'medium',
        interests: interests || [],
        itinerary: guestTripData.itinerary,
        budget: guestTripData.budget,
        hotels: guestTripData.hotels,
        packingNotes: guestTripData.packingNotes,
        localInsights: guestTripData.localInsights || [],
        isPublic: false,
        shareSlug: shareSlug
      })

      return NextResponse.json(trip, { status: 201 })
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (!session?.user) {
      if (!guestGenerationRateLimit) {
        return NextResponse.json({ error: 'Guest generation is temporarily disabled.' }, { status: 403 })
      }
      
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
      const { success } = await guestGenerationRateLimit.limit(ip)
      
      if (!success) {
        return NextResponse.json(
          { error: 'You have used your free daily trip generation. Please sign up to create more trips!' }, 
          { status: 429 }
        )
      }
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
    if (!session?.user) {
      return NextResponse.json({
        isGuest: true,
        _id: 'guest_trip_temp_id', 
        promptUsed: prompt,
        ...generated
      }, { status: 200 })
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
      localInsights: generated.localInsights || [],
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