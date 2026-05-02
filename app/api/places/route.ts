import { NextRequest, NextResponse } from 'next/server';
import { Place } from '../../../types';
import { SEED_PLACES } from '../../lib/seed-data';

// In-memory fallback when Supabase is not configured
let memoryStore: Place[] = [...SEED_PLACES];

function useSupabase() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getSupabase() {
  const { supabase } = await import('../../lib/supabase');
  return supabase;
}

export async function GET() {
  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('places').select('*').order('name');
    if (!error && data) return NextResponse.json(data, { headers: { 'x-data-source': 'supabase' } });

    // Graceful fallback for demo reliability when Supabase is paused/unavailable.
    return NextResponse.json(memoryStore, {
      headers: {
        'x-data-source': 'fallback-memory',
        'x-fallback-reason': error?.message ?? 'supabase_unavailable',
      },
    });
  }
  return NextResponse.json(memoryStore, { headers: { 'x-data-source': 'memory' } });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.name || !body.address || body.lat == null || body.lng == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('places').insert([body]).select().single();
    if (!error && data) return NextResponse.json(data, { status: 201, headers: { 'x-data-source': 'supabase' } });

    // Fallback write (non-persistent across restarts) to keep demo usable.
    const newPlace: Place = { ...body, id: `place_${Date.now()}` };
    memoryStore.push(newPlace);
    return NextResponse.json(newPlace, {
      status: 201,
      headers: {
        'x-data-source': 'fallback-memory',
        'x-fallback-reason': error?.message ?? 'supabase_unavailable',
      },
    });
  }

  const newPlace: Place = { ...body, id: `place_${Date.now()}` };
  memoryStore.push(newPlace);
  return NextResponse.json(newPlace, { status: 201, headers: { 'x-data-source': 'memory' } });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (useSupabase()) {
    const supabase = await getSupabase();
    const { id, ...updates } = body;
    const { data, error } = await supabase.from('places').update(updates).eq('id', id).select().single();
    if (!error && data) return NextResponse.json(data, { headers: { 'x-data-source': 'supabase' } });

    const index = memoryStore.findIndex((p) => p.id === body.id);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    memoryStore[index] = body;
    return NextResponse.json(memoryStore[index], {
      headers: {
        'x-data-source': 'fallback-memory',
        'x-fallback-reason': error?.message ?? 'supabase_unavailable',
      },
    });
  }

  const index = memoryStore.findIndex((p) => p.id === body.id);
  if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  memoryStore[index] = body;
  return NextResponse.json(memoryStore[index], { headers: { 'x-data-source': 'memory' } });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (useSupabase()) {
    const supabase = await getSupabase();
    const { error } = await supabase.from('places').delete().eq('id', id);
    if (!error) return NextResponse.json({ success: true }, { headers: { 'x-data-source': 'supabase' } });

    memoryStore = memoryStore.filter((p) => p.id !== id);
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'x-data-source': 'fallback-memory',
          'x-fallback-reason': error?.message ?? 'supabase_unavailable',
        },
      }
    );
  }

  memoryStore = memoryStore.filter((p) => p.id !== id);
  return NextResponse.json({ success: true }, { headers: { 'x-data-source': 'memory' } });
}
