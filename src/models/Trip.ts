import mongoose, { Schema, Document } from 'mongoose'
import { DayPlan, Budget, Hotel } from '@/types'

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId
  destination: string
  days: number
  budgetType: 'low' | 'medium' | 'high'
  interests: string[]
  itinerary: DayPlan[]
  budget: Budget
  hotels: Hotel[]
  createdAt: Date
}

const ActivitySchema = new Schema({
  id: String,
  name: String,
  time: String,
  duration: String,
  notes: String,
}, { _id: false })

const DayPlanSchema = new Schema({
  day: Number,
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
  destination: { type: String, required: true },
  days: { type: Number, required: true },
  budgetType: { type: String, enum: ['low', 'medium', 'high'], required: true },
  interests: [String],
  itinerary: [DayPlanSchema],
  budget: BudgetSchema,
  hotels: [HotelSchema],
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema)
