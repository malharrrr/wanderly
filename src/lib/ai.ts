import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { DayPlan } from '@/types';
import { Activity } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const gemini = new GoogleGenAI({});

// Helper function to try Gemini first, fall back to Claude on quota exhaustion
async function callAIWithFallback(prompt: string, maxTokens: number = 2048): Promise<string> {
  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(' Trying Gemini...');
      const response = await gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const text = response.text;
      if (!text) throw new Error('No response text from Gemini');
      console.log('✅Gemini succeeded');
      return text;
    } catch (geminiError: any) {
      const errorMessage = geminiError?.message || '';
      // Check if it's a quota/billing error
      if (errorMessage.includes('RESOURCE_EXHAUSTED') || 
          errorMessage.includes('quota') || 
          errorMessage.includes('billing') ||
          errorMessage.includes('403') ||
          errorMessage.includes('429')) {
        console.warn('⚠️ Gemini quota exhausted or billing issue, falling back to Claude...');
      } else {
        // For other Gemini errors, still fall back but log the error
        console.warn('⚠️ Gemini error:', geminiError.message);
      }
    }
  }

  // Fall back to Claude
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
  const prompt = `You are an expert travel planner. Extract the details from the user's request and generate a realistic, highly detailed itinerary.

User Request: "${userPrompt}"

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
- For hotel tier, ONLY use: "budget", "mid", or "luxury" (never use "mid-range", "economy", "premium", or other variations).`;

  const text = await callAIWithFallback(prompt, 4096);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function getAlternativeActivities(destination: string, currentActivity: string): Promise<Activity[]> {
  const prompt = `You are a travel planner. The user wants to replace the activity "${currentActivity}" in ${destination}.
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

  console.log(`Generating alternatives for ${currentActivity}...`);
  const text = await callAIWithFallback(prompt);
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
  return JSON.parse(clean);
}