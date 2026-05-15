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
  costEstimate?: string
}

export interface DayPlan {
  day: number
  theme: string
  dailyTip?: string
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
  collaborators: string[]
  polls: Poll[]
  expenses: Expense[]    
  promptUsed: string
  origin?: string 
  destination: string
  bestTimeToVisit?: string
  days: number
  travelers: number
  season: string
  vibe: string
  itinerary: DayPlan[]
  budget: Budget
  hotels: Hotel[]
  packingNotes: string[]
  localInsights?: string[]
  isPublic: boolean
  shareSlug?: string
  budgetType: string
  interests: string[]
  createdAt: string
}

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

export interface WeatherLocationForecast {
  location: string
  summary: string
  daily: DailyWeather[]
}

export interface PollOption {
  _id?: string;
  text: string;
  votes: string[]; // array of user emails or IDs
}

export interface Poll {
  _id?: string;
  question: string;
  options: PollOption[];
  createdBy: string;
}

export interface Expense {
  _id?: string;
  description: string;
  amount: number;
  paidBy: string; // user email or name
  date: string;
}