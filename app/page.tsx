'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Place, Category, CATEGORIES } from '../types';
import { SEED_PLACES } from './lib/seed-data';
import PlaceCard from './components/PlaceCard';
import CategoryFilter from './components/CategoryFilter';
import PlaceFormModal from './components/PlaceFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import TripPlanner from './components/TripPlanner';

const TokyoMap = dynamic(() => import('./components/TokyoMap'), { ssr: false });
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

async function fetchPlaces(): Promise<Place[]> {
  const res = await fetch('/api/places');
  if (!res.ok) throw new Error('Failed to fetch');

  if (typeof window !== 'undefined') {
    const source = res.headers.get('x-data-source') || 'unknown';
    (window as any).__TOKYO_DATA_SOURCE__ = source;
  }

  return res.json();
}

type SheetState = 'peek' | 'half';

export default function Home() {
  const qc = useQueryClient();
  const { data: places = SEED_PLACES, isLoading, isError, refetch } = useQuery({ queryKey: ['places'], queryFn: fetchPlaces });
  const allCats = useMemo(() => new Set(Object.keys(CATEGORIES) as Category[]), []);
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set(allCats));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editPlace, setEditPlace] = useState<Place | null>(null);
  const [deletePlace, setDeletePlace] = useState<Place | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortNearby, setSortNearby] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const listRef = useRef<HTMLDivElement>(null);
  const gotItBtnRef = useRef<HTMLButtonElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartY = useRef<number>(0);
  const dragStartSheet = useRef<SheetState>('peek');

  useEffect(() => {
    if (!selectedId) return;
    const el = cardRefs.current[selectedId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('tokyo_intro_seen');
      if (!seen) setIntroOpen(true);
    } catch {
      setIntroOpen(true);
    }
  }, []);

  const dismissIntro = () => {
    setIntroOpen(false);
    try {
      localStorage.setItem('tokyo_intro_seen', '1');
    } catch {}
  };

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unsupported');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const showIntroAgain = () => {
    setIntroOpen(true);
    try {
      localStorage.removeItem('tokyo_intro_seen');
    } catch {}
  };

  useEffect(() => {
    if (!introOpen) return;
    gotItBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissIntro();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [introOpen]);

  const toggleCat = useCallback((cat: Category) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else next.add(cat);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setActiveCats((prev) => (prev.size === allCats.size ? new Set(['restaurant'] as Category[]) : new Set(allCats)));
  }, [allCats]);

  const counts = useMemo(
    () => places.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }), {} as Record<string, number>),
    [places]
  );

  const filtered = useMemo(() => {
    const synonymToCategory: Record<string, Category> = {
      ramen: 'restaurant',
      ramyun: 'restaurant',
      food: 'restaurant',
      restaurant: 'restaurant',
      bar: 'drink',
      pub: 'drink',
      cocktail: 'drink',
      izakaya: 'drink',
      drink: 'drink',
      cafe: 'coffee',
      coffee: 'coffee',
      kissaten: 'coffee',
      salon: 'hair_salon',
      haircut: 'hair_salon',
      hair: 'hair_salon',
      art: 'gallery_museum',
      museum: 'gallery_museum',
      gallery: 'gallery_museum',
      exhibition: 'gallery_museum',
      shop: 'shopping',
      shopping: 'shopping',
      store: 'shopping',
      vintage: 'shopping',
      music: 'music',
      jazz: 'music',
      livehouse: 'music',
      concert: 'music',
    };

    const base = places.filter((p) => {
      if (!activeCats.has(p.category)) return false;
      const raw = search.trim().toLowerCase();
      if (!raw) return true;

      const tokens = raw.split(/\s+/).filter(Boolean);
      const haystack = [p.name, p.address, p.introduction || '', p.opening_hours || '', CATEGORIES[p.category].label, p.category]
        .join(' ')
        .toLowerCase();

      return tokens.every((token) => {
        if (haystack.includes(token)) return true;
        const mapped = synonymToCategory[token];
        return mapped ? p.category === mapped : false;
      });
    });

    if (!userLocation || !sortNearby) return base;

    const dist = (aLat: number, aLng: number, bLat: number, bLng: number) => {
      const toRad = (n: number) => (n * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(bLat - aLat);
      const dLng = toRad(bLng - aLng);
      const x =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };

    return [...base].sort(
      (p1, p2) =>
        dist(userLocation.lat, userLocation.lng, p1.lat, p1.lng) - dist(userLocation.lat, userLocation.lng, p2.lat, p2.lng)
    );
  }, [places, activeCats, search, userLocation, sortNearby]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheetState((s) => (s === 'peek' ? 'half' : s));
  }, []);

  const handleAdd = async (data: Omit<Place, 'id'>) => {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add');
    const newPlace = await res.json();
    qc.setQueryData(['places'], (old: Place[] = []) => [...old, newPlace]);
  };

  const handleEdit = async (data: Place) => {
    const res = await fetch('/api/places', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update');
    const updated = await res.json();
    qc.setQueryData(['places'], (old: Place[] = []) => old.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/places?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    qc.setQueryData(['places'], (old: Place[] = []) => old.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const sheetHeight: Record<SheetState, string> = { peek: '20vh', half: '70vh' };
  const cycleSheet = () => setSheetState((s) => (s === 'peek' ? 'half' : 'peek'));
  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartSheet.current = sheetState;
  };
  const handleDragEnd = (e: React.TouchEvent) => {
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) < 20) {
      cycleSheet();
      return;
    }
    if (delta > 40) setSheetState('half');
    else if (delta < -40) setSheetState('peek');
  };

  const PanelContent = (
    <>
      <div className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-100">
        <div className="px-5 pt-3 pb-2">
          <span className="text-[10px] uppercase tracking-[0.16em] text-gray-400">
            {filtered.length} place{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="px-5 pb-2">
          <button
            onClick={() => setFilterOpen((f) => !f)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-700 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            {filterOpen ? 'Hide filters' : 'Filter places'}
            {activeCats.size < Object.keys(CATEGORIES).length ? ` (${activeCats.size})` : ''}
          </button>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.16em] text-gray-400">
            {filtered.length} place{filtered.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setSortNearby((v) => !v)}
            disabled={!userLocation}
            className={`px-2.5 py-1 border rounded-full text-[10px] transition-colors ${
              sortNearby ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-500'
            } ${!userLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={!userLocation ? 'Enable location from intro overlay first' : 'Toggle nearby sorting'}
          >
            Sort by nearby {sortNearby ? 'on' : 'off'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlannerOpen(true)}
            className="flex flex-shrink-0 items-center justify-center gap-1.5 min-w-[104px] px-4 py-1.5 border border-purple-200 rounded-full text-[12px] text-purple-500 hover:border-purple-400 hover:text-purple-700 transition-all active:scale-95"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="whitespace-nowrap">Ask AI</span>
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex flex-shrink-0 items-center justify-center gap-1.5 min-w-[112px] px-4 py-1.5 border border-gray-200 rounded-full text-[12px] text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-all active:scale-95"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="whitespace-nowrap">Add place</span>
          </button>
        </div>
      </div>

      <div className="relative px-5 pb-3 hidden md:block">
        <svg
          className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search cafe, restaurant, and drinking places"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors bg-gray-50/50"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {typeof window !== 'undefined' && (window as any).__TOKYO_DATA_SOURCE__ === 'fallback-memory' && (
        <div className="mx-5 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          Data service is waking up. Showing backup demo data for now — recent edits may not persist until live data reconnects.
        </div>
      )}

      <div className={`md:block ${filterOpen ? 'block' : 'hidden'}`}>
        <CategoryFilter activeCategories={activeCats} onToggle={toggleCat} onToggleAll={toggleAll} counts={counts} />
      </div>

      <div className="flex-1 overflow-y-auto" ref={listRef}>
        <div className="md:hidden px-5 pt-2 pb-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSortNearby((v) => !v)}
              disabled={!userLocation}
              className={`flex items-center justify-center whitespace-nowrap px-2 py-2 border rounded-full text-[11px] transition-colors ${
                sortNearby ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-500'
              } ${!userLocation ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={!userLocation ? 'Enable location from intro overlay first' : 'Toggle nearby sorting'}
            >
              Nearby {sortNearby ? 'on' : 'off'}
            </button>
            <button
              onClick={() => setPlannerOpen(true)}
              className="flex items-center justify-center gap-1 px-2 py-2 border border-purple-200 rounded-full text-[11px] text-purple-500 hover:border-purple-400 hover:text-purple-700 transition-all active:scale-95"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="whitespace-nowrap">Ask AI</span>
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center justify-center gap-1 px-2 py-2 border border-gray-200 rounded-full text-[11px] text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-all active:scale-95"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="whitespace-nowrap">Add place</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-[13px] text-gray-400">Loading places…</div>
        ) : isError ? (
          <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-[12px] text-red-700">
            Couldn’t load places right now.
            <button onClick={() => refetch()} className="ml-2 underline underline-offset-2">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-44 text-center px-6">
            <p className="text-[13px] text-gray-500">No places match your current search or filters.</p>
            <p className="text-[11px] text-gray-400 mt-1">Try another keyword, or reset filters to explore all places.</p>
          </div>
        ) : (
          filtered.map((place) => (
            <div key={place.id} ref={(el) => {
              cardRefs.current[place.id] = el;
            }}>
              <PlaceCard
                place={place}
                isSelected={selectedId === place.id}
                isHovered={hoveredId === place.id}
                userLocation={userLocation}
                onClick={() => {
                  handleSelect(place.id);
                  setSheetState('half');
                }}
                onMouseEnter={() => setHoveredId(place.id)}
                onMouseLeave={() => setHoveredId(null)}
                onEdit={() => setEditPlace(place)}
                onDelete={() => setDeletePlace(place)}
              />
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-white">
      {introOpen && (
        <div className="absolute inset-0 z-[70] bg-white/95 backdrop-blur-[1px] flex items-start justify-center">
          <div className="w-full max-w-[720px] px-6 pt-16 md:pt-20">
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[44px] md:text-[56px] leading-none text-gray-900">
              Tokyo
            </h2>
            <p className="mt-2 text-[14px] md:text-[16px] uppercase tracking-[0.24em] text-gray-500">Travel Notes</p>
            <p className="mt-6 text-[22px] md:text-[28px] leading-[1.35] text-gray-800">
              Curated Tokyo spots with map-first exploration, thoughtful editorial notes, and resilient fallback mode for reliable live demos.
            </p>
            <div className="mt-5">
              <button
                onClick={requestLocation}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 text-[14px] hover:border-gray-500 transition-colors"
              >
                {locationStatus === 'requesting'
                  ? 'Requesting location…'
                  : locationStatus === 'granted'
                    ? 'Location enabled ✓'
                    : 'Enable location for nearby results'}
              </button>
              {locationStatus === 'denied' && (
                <p className="mt-2 text-[12px] text-amber-700">Location was denied. You can still browse all places and use Directions.</p>
              )}
              {locationStatus === 'unsupported' && (
                <p className="mt-2 text-[12px] text-amber-700">This browser does not support location access.</p>
              )}
            </div>
            <button
              ref={gotItBtnRef}
              onClick={dismissIntro}
              className="mt-8 px-6 py-3 rounded-xl bg-gray-900 text-white text-[16px] hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      <div className="hidden md:flex w-full h-full">
        <div className="flex-1 relative min-w-0">
          <TokyoMap places={filtered} selectedId={selectedId} hoveredId={hoveredId} onSelect={handleSelect} onHover={setHoveredId} apiKey={API_KEY} listRef={listRef} />
          <div className="absolute top-0 left-0 px-6 py-5 pointer-events-none">
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[26px] text-gray-900 leading-none tracking-tight drop-shadow-sm">
              Tokyo
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Travel Notes</p>
          </div>
        </div>
        <div className="w-[400px] flex-shrink-0 border-l border-gray-100 flex flex-col bg-white">{PanelContent}</div>
      </div>
      <div className="md:hidden w-full h-full relative">
        <div className="absolute inset-0">
          <TokyoMap places={filtered} selectedId={selectedId} hoveredId={hoveredId} onSelect={handleSelect} onHover={setHoveredId} apiKey={API_KEY} listRef={listRef} />
        </div>
        <div className="absolute top-0 left-0 px-5 py-4 pointer-events-none">
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[22px] text-gray-900 leading-none tracking-tight drop-shadow-sm">
            Tokyo
          </h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-1">Travel Notes</p>
        </div>
        <div
          className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl flex flex-col"
          style={{ height: sheetHeight[sheetState], transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)', boxShadow: '0 -4px 24px rgba(0,0,0,0.10)' }}
        >
          <div
            className="flex-shrink-0 flex flex-col items-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onClick={cycleSheet}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${sheetState === 'peek' ? 'invisible' : 'visible'}`}>{PanelContent}</div>
          {sheetState === 'peek' && (
            <div className="flex items-center justify-center pb-3 gap-2" onClick={cycleSheet}>
              <span className="text-[12px] text-gray-500 font-medium">{filtered.length} places</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>
          )}
        </div>
      </div>
      {addOpen && <PlaceFormModal mode="add" onClose={() => setAddOpen(false)} onSave={handleAdd as any} />}
      {editPlace && <PlaceFormModal mode="edit" initial={editPlace} onClose={() => setEditPlace(null)} onSave={handleEdit as any} />}
      {deletePlace && <DeleteConfirmModal place={deletePlace} onClose={() => setDeletePlace(null)} onConfirm={() => handleDelete(deletePlace.id)} />}
      {plannerOpen && <TripPlanner places={places} onClose={() => setPlannerOpen(false)} />}

      {!introOpen && (
        <button
          onClick={showIntroAgain}
          className="absolute right-4 bottom-4 z-[60] rounded-full border border-gray-200 bg-white/95 px-3 py-1.5 text-[11px] text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-colors"
        >
          Show intro again
        </button>
      )}
    </main>
  );
}
