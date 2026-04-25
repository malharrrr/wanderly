import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getWeatherContext } from '@/lib/weather'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const destinations = searchParams.get('destinations')
  const season = searchParams.get('season')

  if (!destinations || !season) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  try {
    const weather = await getWeatherContext(destinations)
    return NextResponse.json({ weather })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 })
  }
}