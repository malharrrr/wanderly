import mongoose, { Schema, Document } from 'mongoose'
import { DayPlan, Budget, Hotel } from '@/types'

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId
  promptUsed: string
  origin?: string
  destination: string
  bestTimeToVisit: string
  days: number
  travelers: number
  season: string
  vibe: string
  itinerary: DayPlan[]
  budget: Budget
  hotels: Hotel[]
  packingNotes: string[]
  isPublic: boolean
  shareSlug: string
  budgetType: string
  interests: string[]
  createdAt: Date
}

const ActivitySchema = new Schema({
  id: String,
  name: String,
  time: String,
  duration: String,
  notes: String,
  costEstimate: String,
}, { _id: false })

const DayPlanSchema = new Schema({
  day: Number,
  theme: String,
  dailyTip: String,
  activities: [ActivitySchema],
}, { _id: false })

const BudgetSchema = new Schema({
  flights: Number,
  accommodation: Number,
  food: Number,
  activities: Number,
  total: Number,
}, { _id: false })

const HotelSchema = new Schema({
  name: String,
  tier: { type: String, enum: ['budget', 'mid', 'luxury'] },
  pricePerNight: Number,
  rating: Number,
  description: String,
}, { _id: false })

const TripSchema = new Schema<ITrip>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  promptUsed: { type: String, required: true },
  origin: { type: String, default: null }, 
  destination: { type: String, required: true },
  bestTimeToVisit: { type: String, default: '' }, // new
  days: { type: Number, required: true },
  travelers: { type: Number, default: 1 },
  season: { type: String, default: 'Any' },
  vibe: { type: String, default: 'Balanced' },
  itinerary: [DayPlanSchema],
  budget: BudgetSchema,
  hotels: [HotelSchema],
  packingNotes: [String],
  isPublic: { type: Boolean, default: false },
  shareSlug: { type: String, unique: true, sparse: true },
  budgetType: { type: String, default: 'medium' },
  interests: [String],
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema)