# Tokyo Travel Blog v2

A minimal, editorial travel blog — split-screen greyscale map + curated place list with full CRUD.

## What's new in v2
- Edit any place inline
- Delete with confirmation
- Search bar (name, address, description)
- Website field per place
- Supabase persistent storage (optional)
- Cleaner category icons

## Quick start

```bash
npm install
cp .env.local.example .env.local
# Add your Google Maps API key to .env.local
npm run dev
# → http://localhost:3000
```

## Supabase setup (optional — for persistent storage)

Without Supabase, places are stored in memory and reset when the server restarts.
To persist data permanently:

1. Go to https://supabase.com and create a free project
2. In the SQL Editor, run this schema:

```sql
create table places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  introduction text default '',
  address text not null,
  opening_hours text default '',
  lat double precision not null,
  lng double precision not null,
  website text,
  created_at timestamptz default now()
);

-- Allow public read/write for local dev (tighten for production)
alter table places enable row level security;
create policy "public access" on places for all using (true) with check (true);
```

3. Go to Project Settings → API → copy your Project URL and anon key
4. Add them to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart the dev server — data now persists across restarts.

## Adding your Google Maps places

For each place in your saved Google Maps list:
1. Open the place on Google Maps
2. Right-click the pin → copy the coordinates (first number = lat, second = lng)
3. Click **+ Add place** in the app and fill in the details

## Categories

| Key | Label |
|---|---|
| `restaurant` | Restaurant |
| `drink` | Drink |
| `coffee` | Coffee |
| `hair_salon` | Hair Salon |
| `gallery_museum` | Gallery & Museum |
| `shopping` | Shopping |
| `music` | Music |
| `other` | Other |
