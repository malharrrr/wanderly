export interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  failedLoginAttempts?: number
  lockUntil?: Date
}

export interface Activity {
  id: string
  name: string
  time: string
  duration: string
  notes?: string
  costEstimate?: string // NEW
}

export interface DayPlan {
  day: number
  theme: string // NEW
  dailyTip?: string // NEW
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
  promptUsed: string // NEW
  origin?: string // NEW
  destination: string
  bestTimeToVisit?: string // NEW
  days: number
  travelers: number // NEW
  season: string // NEW
  vibe: string // NEW
  itinerary: DayPlan[]
  budget: Budget
  hotels: Hotel[]
  packingNotes: string[] // NEW
  isPublic: boolean // NEW
  shareSlug?: string // NEW
  budgetType: string // NEW
  interests: string[] // NEW
  createdAt: string
}
// NEW: for weather data
export interface DailyWeather { 
  date: string
  maxTemp: number
  minTemp: number
  code: number
  description: string
}

export interface WeatherForecast {
  summary: string
  daily: DailyWeather[]
}
//represents a single city's forecast
export interface WeatherLocationForecast {
  location: string
  summary: string
  daily: DailyWeather[]
}