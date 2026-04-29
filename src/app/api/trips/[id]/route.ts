import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'
import { regenerateDay, getAlternativeActivities } from '@/lib/ai'
import { pusherServer } from '@/lib/pusher-server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  
  // find the trip
  const trip = await TripModel.findById(id).lean() as any
  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  // ensure the user is either the owner or a collaborator
  const isOwner = (trip as any).userId.toString() === (session.user as any).id
  const isCollaborator = trip.collaborators?.includes(session.user.email)
  
  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(trip)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email

  await connectDB()
  
  const trip = await TripModel.findById(id)
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = trip.userId.toString() === (session.user as any).id
  const isCollaborator = trip.collaborators?.includes(userEmail)
  
  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, dayNumber, activityId, activityName, instruction, newActivity } = body


  if (action === 'add_collaborator') {
    if (!trip.collaborators) trip.collaborators = []
    if (!trip.collaborators.includes(body.email)) {
      trip.collaborators.push(body.email)
      await trip.save()
      await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    }
    return NextResponse.json(trip)
  }

  if (action === 'create_poll') {
    if (!trip.polls) trip.polls = []
    trip.polls.push({
      question: body.question,
      options: body.options.map((opt: string) => ({ text: opt, votes: [] })),
      createdBy: userEmail
    })
    await trip.save()
    await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    return NextResponse.json(trip)
  }

  if (action === 'vote_poll') {
    if (!trip.polls) return NextResponse.json(trip)
    const poll = trip.polls.id(body.pollId)
    
    if (poll) {
      poll.options.forEach((opt: any) => {
        opt.votes = opt.votes.filter((v: string) => v !== userEmail)
      })
      const selectedOption = poll.options.id(body.optionId)
      if (selectedOption) selectedOption.votes.push(userEmail)
      
      await trip.save()
      await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    }
    return NextResponse.json(trip)
  }

  if (action === 'add_expense') {
    if (!trip.expenses) trip.expenses = []
    trip.expenses.push({
      description: body.description,
      amount: body.amount,
      paidBy: userEmail,
    })
    await trip.save()
    await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    return NextResponse.json(trip)
  }

  if (action === 'toggle_share') {
    trip.isPublic = !trip.isPublic
    await trip.save()
    await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    return NextResponse.json({ isPublic: trip.isPublic, shareSlug: trip.shareSlug });
  }

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

  if (action === 'commit_swap') {
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber);
    if (dayPlan) {
      const actIndex = dayPlan.activities.findIndex((a: any) => a.id === activityId);
      if (actIndex !== -1) {
        newActivity.id = `act_${dayNumber}_${Date.now()}`;
        dayPlan.activities[actIndex] = newActivity;
      }
    }
    await trip.save()
    await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    return NextResponse.json(trip);
  }

  if (action === 'remove_activity') {
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
    if (dayPlan) {
      dayPlan.activities = dayPlan.activities.filter((a: any) => a.id !== activityId)
    }
    await trip.save()
    await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    return NextResponse.json(trip);
  }

  if (action === 'add_activity') {
    const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
    if (dayPlan && activityName) {
      dayPlan.activities.push({ id: `act_${dayNumber}_${Date.now()}`, name: activityName, time: 'Flexible', duration: '', notes: '' })
    }
    await trip.save()
    await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
    return NextResponse.json(trip);
  }

  if (action === 'regenerate_day') {
    try {
      const dayPlan = trip.itinerary.find((d: any) => d.day === dayNumber)
      const currentActivities = dayPlan?.activities.map((a: any) => a.name) || []
      const newDay = await regenerateDay(trip.destination, dayNumber, currentActivities, instruction)
      
      const idx = trip.itinerary.findIndex((d: any) => d.day === dayNumber)
      if (idx !== -1) trip.itinerary[idx] = newDay
      
      await trip.save()
      await pusherServer.trigger(`trip-${id}`, 'trip-updated', {}) 
      return NextResponse.json(trip);
    } catch (err) {
      console.error('Regenerate day error:', err)
      if ((err as any).status === 503) {
        return NextResponse.json({ error: 'The AI service is currently experiencing high demand. Please try again later.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to regenerate day' }, { status: 500 });
    }
  }

  return NextResponse.json(trip)
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
    return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 })
  }

  return NextResponse.json({ message: 'Trip deleted successfully' })
}