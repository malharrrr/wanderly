import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50).trim(),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const TripResponseSchema = z.object({
  metadata: z.object({
    destination: z.string(),
    days: z.number(),
    travelers: z.number(),
    season: z.string(),
    vibe: z.string(),
    budgetType: z.string().optional(),
    interests: z.array(z.string()).optional()
  }),
  packingNotes: z.array(z.string()),
  itinerary: z.array(z.object({
    day: z.number(),
    theme: z.string(),
    dailyTip: z.string().optional(),
    activities: z.array(z.object({
      id: z.string(),
      name: z.string(),
      time: z.string(),
      duration: z.string(),
      notes: z.string().optional(),
      costEstimate: z.string().optional()
    }))
  })),
  budget: z.object({
    flights: z.number(),
    accommodation: z.number(),
    food: z.number(),
    activities: z.number(),
    total: z.number()
  }),
  hotels: z.array(z.object({
    name: z.string(),
    tier: z.enum(['budget', 'mid', 'luxury']),
    pricePerNight: z.number(),
    rating: z.number(),
    description: z.string()
  }))
});