import { NextRequest, NextResponse } from 'next/server';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }
    const err = await res.text();
    const parsed = JSON.parse(err);
    const status = parsed?.error?.code;
    // Retry on 503 (overloaded) or 429 (rate limit)
    if ((status === 503 || status === 429) && attempt < retries - 1) {
      const wait = (attempt + 1) * 3000;
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    throw new Error(`Gemini error: ${err}`);
  }
  throw new Error('Gemini failed after retries');
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    if (action === 'describe') {
      const { name, category, address } = body;
      const prompt = `You are writing a concise, evocative description for a personal Tokyo travel blog.
Write 2-3 sentences about "${name}" (a ${category} located at ${address} in Tokyo).
Be specific, atmospheric and personal — like a recommendation from a well-travelled friend.
Do not use generic phrases like "hidden gem" or "must-visit". No bullet points. Plain text only.`;
      const text = await callGemini(prompt);
      return NextResponse.json({ text: text.trim() });
    }

    if (action === 'categorise') {
      const { name, address } = body;
      const prompt = `You are categorising a Tokyo place for a travel blog.
Given the place name "${name}" at address "${address}",
return ONLY one of these exact category keys (nothing else, no explanation):
restaurant, drink, coffee, hair_salon, gallery_museum, shopping, music, other

Return only the key, e.g.: coffee`;
      const text = await callGemini(prompt);
      const validCategories = ['restaurant', 'drink', 'coffee', 'hair_salon', 'gallery_museum', 'shopping', 'music', 'other'];
      const guessed = text.trim().toLowerCase().replace(/[^a-z_]/g, '');
      const category = validCategories.includes(guessed) ? guessed : 'other';
      return NextResponse.json({ category });
    }

    if (action === 'plan') {
      const { question, places } = body;
      const placesSummary = places
        .map((p: any) => `- ${p.name} (${p.category}) — ${p.address}`)
        .join('\n');
      const prompt = `You are a helpful Tokyo travel assistant. The user has a personal travel blog with these saved places in Tokyo:

${placesSummary}

The user asks: "${question}"

Answer helpfully and specifically using only places from the list above. Be concise (max 4-5 sentences).
If relevant places exist, name them specifically. If no places match, suggest what kind of place to look for.
Do not make up places that are not in the list.`;
      const text = await callGemini(prompt);
      return NextResponse.json({ text: text.trim() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}