import { GoogleGenAI } from "@google/genai";
import { TripFormData, DayPlan, Budget, Hotel } from '@/types';

interface GeneratedTrip {
  itinerary: DayPlan[];
  budget: Budget;
  hotels: Hotel[];
}

const ai = new GoogleGenAI({});


export async function generateTripPlan(data: TripFormData): Promise<GeneratedTrip> {
  const budgetRanges = {
    low: 'under $50/day',
    medium: '$50–150/day',
    high: '$150+/day',
  };

  const prompt = `You are an expert travel planner. Generate a detailed travel plan as JSON.

Trip details:
- Destination: ${data.destination}
- Duration: ${data.days} days
- Budget: ${data.budgetType} (${budgetRanges[data.budgetType]})
- Interests: ${data.interests.join(', ')}

Return ONLY valid JSON with this exact structure (no markdown fences):
{
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "id": "act_1_1",
          "name": "Activity name",
          "time": "9:00 AM",
          "duration": "2 hrs",
          "notes": "A helpful tip about this activity"
        }
      ]
    }
  ],
  "budget": {
    "flights": 400,
    "accommodation": 300,
    "food": 150,
    "activities": 100,
    "total": 950
  },
  "hotels": [
    { "name": "Hotel", "tier": "budget", "pricePerNight": 45, "rating": 3, "description": "Desc" },
    { "name": "Hotel", "tier": "mid", "pricePerNight": 110, "rating": 4, "description": "Desc" },
    { "name": "Hotel", "tier": "luxury", "pricePerNight": 300, "rating": 5, "description": "Desc" }
  ]
}

Rules:
- Generate exactly ${data.days} days
- 3-4 activities per day tailored to: ${data.interests.join(', ')}
- Budget numbers should be realistic for ${data.destination}`;

  console.log('✨ [Free Tier] Calling Gemini 3 Flash Preview...');

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", //
    contents: prompt
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response text from AI model');
  }
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function regenerateDay(
  destination: string,
  day: number,
  currentActivities: string[],
  instruction: string
): Promise<DayPlan> {
  const prompt = `You are an expert travel planner. Regenerate Day ${day} of a trip to ${destination}.

Current activities: ${currentActivities.join(', ')}
User instruction: "${instruction}"

Return ONLY valid JSON:
{
  "day": ${day},
  "activities": [
    {
      "id": "act_${day}_1",
      "name": "Activity name",
      "time": "9:00 AM",
      "duration": "2 hrs",
      "notes": "A helpful tip"
    }
  ]
}`;

  console.log(`✨ [Free Tier] Regenerating day ${day} with Gemini 3 Flash Preview...`);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  const text = response.text;
  if (!text) {
    throw new Error('No response text from AI model');
  }
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}