const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

// POST /api/ai-planner/generate
router.post('/generate', async (req, res) => {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { destination, fromDate, toDate, activityPreferences = [], companion } = req.body;

  if (!destination || !fromDate || !toDate) {
    return res.status(400).json({ error: 'destination, fromDate, and toDate are required' });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);
  const noOfDays = Math.max(1, Math.round((to - from) / 86400000) + 1);

  let prompt = `Plan a ${noOfDays}-day trip to ${destination}`;
  if (companion) prompt += `, travelling with ${companion}`;
  if (activityPreferences.length > 0) prompt += `. Preferred activities: ${activityPreferences.join(', ')}`;
  prompt += `. Travel dates: ${from.toDateString()} to ${to.toDateString()}.`;
  prompt += `

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "aboutThePlace": "string (50+ words about the destination)",
  "bestTimeToVisit": "string",
  "topActivities": [{ "name": "string", "location": "string" }],
  "localCuisine": ["string"],
  "packingChecklist": ["string"],
  "itinerary": [
    {
      "day": 1,
      "title": "string",
      "morning": ["string"],
      "afternoon": ["string"],
      "evening": ["string"]
    }
  ],
  "topPlaces": [{ "name": "string", "lat": number, "lng": number }]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: 'You are a helpful travel assistant. Always respond with valid JSON only — no markdown fences, no extra text.',
    });

    const text = message.content[0]?.text;
    if (!text) return res.status(500).json({ error: 'No response from Claude' });

    const plan = JSON.parse(text);
    res.json({ plan, destination, noOfDays, fromDate, toDate });
  } catch (err) {
    console.error('AI planner error:', err.message);
    if (err.status === 401) {
      return res.status(401).json({ error: 'Invalid Anthropic API key. Set ANTHROPIC_API_KEY in backend/.env' });
    }
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Claude returned invalid JSON. Please try again.' });
    }
    res.status(500).json({ error: err.message || 'Failed to generate plan' });
  }
});

module.exports = router;
