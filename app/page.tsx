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

  // Optional hint for UI; fallback remains non-blocking.
  if (typeof window !== 'undefined') {
    const source = res.headers.get('x-data-source') || 'unknown';
    (window as any).__TOKYO_DATA_SOURCE__ = source;
  }

  return res.json();
}

type SheetState = 'peek' | 'half' | 'full';

export default function Home() {
  const qc = useQueryClient();
  const { data: places = SEED_PLACES } = useQuery({ queryKey: ['places'], queryFn: fetchPlaces });
  const allCats = useMemo(() => new Set(Object.keys(CATEGORIES) as Category[]), []);
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set(allCats));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editPlace, setEditPlace] = useState<Place | null>(null);
  const [deletePlace, setDeletePlace] = useState<Place | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartY = useRef<number>(0);
  const dragStartSheet = useRef<SheetState>('peek');

  useEffect(() => {
    if (!selectedId) return;
    const el = cardRefs.current[selectedId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const toggleCat = useCallback((cat: Category) => {
    setActiveCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) { if (next.size > 1) next.delete(cat); }
      else next.add(cat);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setActiveCats(prev => prev.size === allCats.size ? new Set(['restaurant'] as Category[]) : new Set(allCats));
  }, [allCats]);

  const counts = useMemo(() =>
    places.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }), {} as Record<string, number>),
    [places]);

  const filtered = useMemo(() =>
    places.filter(p => {
      if (!activeCats.has(p.category)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.introduction?.toLowerCase().includes(q);
      }
      return true;
    }),
    [places, activeCats, search]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
    setSheetState(s => s === 'peek' ? 'half' : s);
  }, []);

  const handleAdd = async (data: Omit<Place, 'id'>) => {
    const res = await fetch('/api/places', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to add');
    const newPlace = await res.json();
    qc.setQueryData(['places'], (old: Place[] = []) => [...old, newPlace]);
  };

  const handleEdit = async (data: Place) => {
    const res = await fetch('/api/places', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error('Failed to update');
    const updated = await res.json();
    qc.setQueryData(['places'], (old: Place[] = []) => old.map(p => p.id === updated.id ? updated : p));
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/places?id=${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    qc.setQueryData(['places'], (old: Place[] = []) => old.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const sheetHeight: Record<SheetState, string> = { peek: '80px', half: '55vh', full: '92vh' };
  const cycleSheet = () => setSheetState(s => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek');
  const handleDragStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; dragStartSheet.current = sheetState; };
  const handleDragEnd = (e: React.TouchEvent) => {
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) < 20) { cycleSheet(); return; }
    if (delta > 40) setSheetState(s => s === 'peek' ? 'half' : 'full');
    else if (delta < -40) setSheetState(s => s === 'full' ? 'half' : 'peek');
  };

  const PanelContent = (
    <>
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.16em] text-gray-400">{filtered.length} place{filtered.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setFilterOpen(f => !f)} className="md:hidden flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-full text-[10px] text-gray-500">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filter {activeCats.size < Object.keys(CATEGORIES).length ? `(${activeCats.size})` : ''}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPlannerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-200 rounded-full text-[11px] text-purple-500 hover:border-purple-400 hover:text-purple-700 transition-all active:scale-95">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Ask AI
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-[11px] text-gray-600 hover:border-gray-500 hover:text-gray-900 transition-all active:scale-95">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add place
          </button>
        </div>
      </div>
      <div className="relative px-5 pb-3">
        <svg className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search places..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-8 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors bg-gray-50/50" />
        {search && <button onClick={() => setSearch('')} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
      </div>
      {(typeof window !== 'undefined' && (window as any).__TOKYO_DATA_SOURCE__ === 'fallback-memory') && (
        <div className="mx-5 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          Data service is waking up. Showing backup demo data for now.
        </div>
      )}
      <div className={`md:block ${filterOpen ? 'block' : 'hidden'}`}>
        <CategoryFilter activeCategories={activeCats} onToggle={toggleCat} onToggleAll={toggleAll} counts={counts} />
      </div>
      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-[13px] text-gray-300">No places found</div>
        ) : (
          filtered.map(place => (
            <div key={place.id} ref={el => { cardRefs.current[place.id] = el; }}>
              <PlaceCard place={place} isSelected={selectedId === place.id} isHovered={hoveredId === place.id}
                onClick={() => { handleSelect(place.id); setSheetState('half'); }}
                onMouseEnter={() => setHoveredId(place.id)} onMouseLeave={() => setHoveredId(null)}
                onEdit={() => setEditPlace(place)} onDelete={() => setDeletePlace(place)} />
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <main className="relative flex h-screen w-screen overflow-hidden bg-white">
      <div className="hidden md:flex w-full h-full">
        <div className="flex-1 relative min-w-0">
          <TokyoMap places={filtered} selectedId={selectedId} hoveredId={hoveredId} onSelect={handleSelect} onHover={setHoveredId} apiKey={API_KEY} listRef={listRef} />
          <div className="absolute top-0 left-0 px-6 py-5 pointer-events-none">
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[26px] text-gray-900 leading-none tracking-tight drop-shadow-sm">Tokyo</h1>
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
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[22px] text-gray-900 leading-none tracking-tight drop-shadow-sm">Tokyo</h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-1">Travel Notes</p>
        </div>
        <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl flex flex-col" style={{ height: sheetHeight[sheetState], transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)', boxShadow: '0 -4px 24px rgba(0,0,0,0.10)' }}>
          <div className="flex-shrink-0 flex flex-col items-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing" onTouchStart={handleDragStart} onTouchEnd={handleDragEnd} onClick={cycleSheet}>
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${sheetState === 'peek' ? 'invisible' : 'visible'}`}>{PanelContent}</div>
          {sheetState === 'peek' && (
            <div className="flex items-center justify-center pb-3 gap-2" onClick={cycleSheet}>
              <span className="text-[12px] text-gray-500 font-medium">{filtered.length} places</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="18 15 12 9 6 15"/></svg>
            </div>
          )}
        </div>
      </div>
      {addOpen && <PlaceFormModal mode="add" onClose={() => setAddOpen(false)} onSave={handleAdd as any} />}
      {editPlace && <PlaceFormModal mode="edit" initial={editPlace} onClose={() => setEditPlace(null)} onSave={handleEdit as any} />}
      {deletePlace && <DeleteConfirmModal place={deletePlace} onClose={() => setDeletePlace(null)} onConfirm={() => handleDelete(deletePlace.id)} />}
      {plannerOpen && <TripPlanner places={places} onClose={() => setPlannerOpen(false)} />}
    </main>
  );
}
