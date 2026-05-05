import { NextRequest, NextResponse } from 'next/server';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
].filter(Boolean) as string[];

const REQUEST_TIMEOUT_MS = 20000;
const MAX_PLACES = 120;
const MAX_QUESTION_LENGTH = 400;
const DAILY_REQUEST_CAP = Number(process.env.AI_DAILY_REQUEST_CAP || 100);
const dailyCounter = new Map<string, { count: number; day: string }>();

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getClientKey(request: NextRequest) {
  const xff = request.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkAndCountDailyLimit(request: NextRequest): { allowed: boolean; remaining: number } {
  if (!Number.isFinite(DAILY_REQUEST_CAP) || DAILY_REQUEST_CAP <= 0) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }

  const key = `${dayKey()}:${getClientKey(request)}`;
  const today = dayKey();
  const prev = dailyCounter.get(key);
  const nextCount = prev?.day === today ? prev.count + 1 : 1;

  if (nextCount > DAILY_REQUEST_CAP) {
    return { allowed: false, remaining: 0 };
  }

  dailyCounter.set(key, { count: nextCount, day: today });
  return { allowed: true, remaining: Math.max(0, DAILY_REQUEST_CAP - nextCount) };
}

function modelUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

async function callGemini(prompt: string, retries = 3): Promise<string> {
  let lastError = 'Gemini failed';

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let res: Response;

      try {
        res = await fetch(modelUrl(model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
          signal: controller.signal,
        });
      } catch (e: any) {
        clearTimeout(timer);
        const msg = String(e?.message || e || '').toLowerCase();
        if (msg.includes('aborted') || msg.includes('abort')) {
          lastError = `Gemini model ${model} timeout after ${REQUEST_TIMEOUT_MS}ms`;
        } else {
          lastError = `Gemini model ${model} network error: ${e?.message || 'unknown network error'}`;
        }
        break;
      } finally {
        clearTimeout(timer);
      }

      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }

      const errText = await res.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(errText);
      } catch {
        parsed = null;
      }

      const statusCode = parsed?.error?.code ?? res.status;
      const statusMessage = parsed?.error?.message ?? errText ?? 'Unknown Gemini error';
      lastError = `Gemini model ${model} error (${statusCode}): ${statusMessage}`;

      // model not found/unsupported for this key -> try next model
      if (statusCode === 404) break;

      // Retry on 503 (overloaded) or 429 (rate limit)
      if ((statusCode === 503 || statusCode === 429) && attempt < retries - 1) {
        const wait = (attempt + 1) * 3000;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      // any other error -> no point trying more retries for this model
      break;
    }
  }

  throw new Error(lastError);
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const limit = checkAndCountDailyLimit(request);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Daily Ask AI cap reached (${DAILY_REQUEST_CAP}/day). Please try again tomorrow or increase AI_DAILY_REQUEST_CAP.`,
      },
      { status: 429 }
    );
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
      const safeQuestion = String(question || '').trim().slice(0, MAX_QUESTION_LENGTH);
      const safePlaces = Array.isArray(places) ? places.slice(0, MAX_PLACES) : [];

      if (!safeQuestion) {
        return NextResponse.json({ error: 'Question is required' }, { status: 400 });
      }

      const placesSummary = safePlaces
        .map((p: any) => `- ${p.name} (${p.category}) — ${p.address}`)
        .join('\n');
      const prompt = `You are a helpful Tokyo travel assistant. The user has a personal travel blog with these saved places in Tokyo:

${placesSummary}

The user asks: "${safeQuestion}"

Answer helpfully and specifically using only places from the list above. Be concise (max 4-5 sentences).
If relevant places exist, name them specifically. If no places match, suggest what kind of place to look for.
Do not make up places that are not in the list.`;
      const text = await callGemini(prompt);
      return NextResponse.json({ text: text.trim() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (e: any) {
    const message = String(e?.message || 'Unknown Gemini error');
    const lower = message.toLowerCase();

    if (lower.includes('timeout')) {
      return NextResponse.json({ error: message }, { status: 504 });
    }

    if (lower.includes('error (429)') || lower.includes('rate') || lower.includes('quota')) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    if (lower.includes('error (401)') || lower.includes('error (403)')) {
      return NextResponse.json({ error: message }, { status: 401 });
    }

    if (lower.includes('error (404)')) {
      return NextResponse.json({ error: message }, { status: 424 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    modelCandidates: GEMINI_MODELS,
    dailyCap: DAILY_REQUEST_CAP,
  });
}
