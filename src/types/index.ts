export interface User {
  _id: string
  name: string
  email: string
  createdAt: string
}

export interface Activity {
  id: string
  name: string
  time: string
  duration: string
  notes?: string
}

export interface DayPlan {
  day: number
  activities: Activity[]
}

export interface Budget {
  flights: number
  accommodation: number
  food: number
  activities: number
  total: number
}

export interface Hotel {
  name: string
  tier: 'budget' | 'mid' | 'luxury'
  pricePerNight: number
  rating: number
  description: string
}

export interface Trip {
  _id: string
  userId: string
  destination: string
  days: number
  budgetType: 'low' | 'medium' | 'high'
  interests: string[]
  itinerary: DayPlan[]
  budget: Budget
  hotels: Hotel[]
  createdAt: string
}

export interface TripFormData {
  destination: string
  days: number
  budgetType: 'low' | 'medium' | 'high'
  interests: string[]
}
