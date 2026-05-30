import { MetadataRoute } from 'next'
import { connectDB } from '@/lib/db'
import TripModel from '@/models/Trip'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let sharedTripUrls: any[] = []
  
  try {
    await connectDB()
    
    const publicTrips = await TripModel.find({ isPublic: true })
      .select('shareSlug createdAt')
      .lean()
    
    sharedTripUrls = publicTrips.map(trip => ({
      url: `https://wanderly-weld.vercel.app/trip/share/${trip.shareSlug}`,
      lastModified: new Date(trip.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.warn('Could not fetch shared trips for sitemap during build:', error)
  }
  
  return [
    {
      url: 'https://wanderly-weld.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://wanderly-weld.vercel.app/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://wanderly-weld.vercel.app/register',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...sharedTripUrls,
  ]
}