import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { DayPlan, Activity } from '@/types';

const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  time: z.string(),
  duration: z.string(),
  notes: z.string().optional(),
  costEstimate: z.string().optional()
});

const DayPlanSchema = z.object({
  day: z.number(),
  theme: z.string(),
  dailyTip: z.string().optional(),
  activities: z.array(ActivitySchema)
});

const TripResponseSchema = z.object({
  metadata: z.object({
    destination: z.string().nullable().transform(v => v || "Not specified"),
    days: z.number().nullable().transform(v => v || 3),
    travelers: z.number().nullable().transform(v => v || 1),
    season: z.string().nullable().transform(v => v || ""),
    vibe: z.string().nullable().transform(v => v || "")
  }).passthrough(),
  packingNotes: z.array(z.string()),
  itinerary: z.array(DayPlanSchema),
  budget: z.object({
    flights: z.number(),
    accommodation: z.number(),
    food: z.number(),
    activities: z.number(),
    total: z.number()
  }).passthrough(),
  hotels: z.array(z.object({
    name: z.string(),
    tier: z.enum(['budget', 'mid', 'luxury']).or(z.string()), 
    pricePerNight: z.number(),
    rating: z.number(),
    description: z.string()
  }).passthrough())
});

function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return "";
  const truncated = input.slice(0, maxLength);
  const maliciousPatterns = [/ignore/i, /system prompt/i, /jailbreak/i, /<script>/i];
  
  if (maliciousPatterns.some(pattern => pattern.test(truncated))) {
    throw new Error("Malicious activity detected in input");
  }
  return truncated;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function callAIWithFallback(prompt: string, maxTokens: number = 2048): Promise<string> {
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(' Trying Gemini...');
      const response = await gemini.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const text = response.text;
      if (!text) throw new Error('No response text from Gemini');
      console.log('Gemini succeeded');
      return text;
    } catch (geminiError: any) {
      const errorMessage = geminiError?.message || '';
      // Check if it's a quota/billing error
      if (errorMessage.includes('RESOURCE_EXHAUSTED') || 
          errorMessage.includes('quota') || 
          errorMessage.includes('billing') ||
          errorMessage.includes('403') ||
          errorMessage.includes('429')) {
        console.warn('Gemini quota exhausted or billing issue, falling back to Claude...');
      } else {
        console.warn('Gemini error:', geminiError.message);
      }
    }
  }

  console.log(' Using Claude as fallback...');
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  if (!text) throw new Error('No response text from Claude');
  console.log('Claude succeeded');
  return text;
}

export async function generateTripPlan(userPrompt: string): Promise<any> {
  const sanitizedPrompt = sanitizeInput(userPrompt);

  const prompt = `You are an expert travel planner. Extract the details from the user's request and generate a realistic, highly detailed itinerary.

User Request: "${sanitizedPrompt}"

Return ONLY valid JSON with this exact structure (no markdown fences):
{
  "metadata": {
    "destination": "Extracted main destination",
    "days": 5, 
    "travelers": 2, 
    "season": "Extracted season",
    "vibe": "Extracted vibe"
  },
  "packingNotes": ["Item 1", "Item 2"],
  "itinerary": [
    {
      "day": 1,
      "theme": "Arrival",
      "dailyTip": "Tip",
      "activities": [
        { "id": "act_1_1", "name": "Activity name", "time": "14:00", "duration": "2h", "notes": "Tip", "costEstimate": "$20" }
      ]
    }
  ],
  "budget": { "flights": 400, "accommodation": 300, "food": 150, "activities": 100, "total": 950 },
  "hotels": [
    { "name": "Hotel", "tier": "budget", "pricePerNight": 45, "rating": 3, "description": "Desc" }
  ]
}

Rules:
- Infer days (default 3) and travelers (default 1).
- For hotel tier, ONLY use: "budget", "mid", or "luxury" (never use "mid-range", "economy", "premium", or other variations).
- If the request is not related to travel, set "destination" to "Not specified", use empty arrays [] for lists, and ensure there are NO null values in the JSON.`;

  const text = await callAIWithFallback(prompt, 4096);
  const clean = text.replace(/```json|```/g, '').trim();
  
  try {
    const rawData = JSON.parse(clean);
    
    const validatedTrip = TripResponseSchema.parse(rawData);

    const dest = validatedTrip.metadata.destination.toLowerCase();
    if (dest === "not specified" || dest === "unknown" || dest === "" || dest === "extracted main destination") {
      throw new Error("REJECTED_NON_TRAVEL");
    }

    return validatedTrip;

  } catch (err: any) {
    if (err.message === "REJECTED_NON_TRAVEL") {
      throw new Error("Your request could not be processed. Please provide a clear, travel-related destination.");
    }
    console.error("AI output validation failed:", err);
    throw new Error("The AI service returned an incompatible response. Please try again.");
  }
}

export async function getAlternativeActivities(destination: string, currentActivity: string): Promise<Activity[]> {
  const sanitizedActivity = sanitizeInput(currentActivity, 200);

  const prompt = `You are a travel planner. The user wants to replace the activity "${sanitizedActivity}" in ${destination}.
Provide 3 excellent, distinct alternatives (e.g., if the original was a museum, maybe suggest a park, a food tour, or a different type of museum).

Return ONLY a valid JSON array with exactly 3 objects (no markdown fences):
[
  {
    "id": "alt_1",
    "name": "Alternative Activity 1",
    "time": "Flexible",
    "duration": "2 hrs",
    "notes": "Why this is a great alternative",
    "costEstimate": "$15"
  }
]`;

  console.log(`Generating alternatives for ${sanitizedActivity}...`);
  const text = await callAIWithFallback(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  
  try {
    const rawData = JSON.parse(clean);
    return z.array(ActivitySchema).parse(rawData);
  } catch (err) {
    console.error("Alternative activities validation failed:", err);
    throw new Error("Failed to validate alternative activities.");
  }
}

export async function regenerateDay(
  destination: string,
  day: number,
  currentActivities: string[],
  instruction: string
): Promise<DayPlan> {
  const sanitizedInstruction = sanitizeInput(instruction, 300);

  const prompt = `You are an expert travel planner. Regenerate Day ${day} of a trip to ${destination}.

Current activities: ${currentActivities.join(', ')}
User instruction: "${sanitizedInstruction}"

Return ONLY valid JSON:
{
  "day": ${day},
  "theme": "Updated Theme",
  "dailyTip": "Updated Tip",
  "activities": [
    {
      "id": "act_${day}_1",
      "name": "Activity name",
      "time": "9:00 AM",
      "duration": "2 hrs",
      "notes": "A helpful tip",
      "costEstimate": "$10"
    }
  ]
}`;

  const text = await callAIWithFallback(prompt);
  const clean = text.replace(/```json|```/g, '').trim();
  
  try {
    const rawData = JSON.parse(clean);
    return DayPlanSchema.parse(rawData);
  } catch (err) {
    console.error("Regenerate day validation failed:", err);
    throw new Error("Failed to validate regenerated day.");
  }
}