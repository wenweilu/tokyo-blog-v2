'use client';
import { useState, useEffect } from 'react';
import { Place, Category, CATEGORIES } from '../../types';

interface Props {
  mode: 'add' | 'edit';
  initial?: Place;
  onClose: () => void;
  onSave: (data: Omit<Place, 'id'> | Place) => Promise<void>;
}

const EMPTY = {
  name: '', category: 'restaurant' as Category, introduction: '',
  address: '', opening_hours: '', lat: '', lng: '', website: '',
};

export default function PlaceFormModal({ mode, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        category: initial.category,
        introduction: initial.introduction,
        address: initial.address,
        opening_hours: initial.opening_hours,
        lat: String(initial.lat),
        lng: String(initial.lng),
        website: initial.website ?? '',
      });
    }
  }, [initial]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.lat || !form.lng) {
      setError('Name, address, latitude and longitude are required.');
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a number between -90 and 90.');
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a number between -180 and 180.');
      return;
    }

    const website = form.website.trim();
    if (website) {
      try {
        const u = new URL(website);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          setError('Website must start with http:// or https://');
          return;
        }
      } catch {
        setError('Website must be a valid URL (e.g. https://example.com).');
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...(mode === 'edit' && initial ? { id: initial.id } : {}),
        name: form.name.trim(),
        category: form.category,
        introduction: form.introduction.trim(),
        address: form.address.trim(),
        opening_hours: form.opening_hours.trim(),
        lat,
        lng,
        website: website || undefined,
      };
      await onSave(payload as any);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-800 bg-white focus:outline-none focus:border-gray-500 transition-colors placeholder:text-gray-300';
  const labelCls = 'block text-[10px] uppercase tracking-[0.14em] text-gray-400 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[440px] mx-4 overflow-hidden shadow-2xl shadow-black/10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[19px] text-gray-900">
            {mode === 'add' ? 'Add a place' : 'Edit place'}
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-700 transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} placeholder="e.g. Fuglen Tokyo" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
              {(Object.entries(CATEGORIES) as [Category, { label: string }][]).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Introduction</label>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="What makes this place special..." value={form.introduction} onChange={e => set('introduction', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Address *</label>
            <input className={inputCls} placeholder="e.g. 1-16-11 Tomigaya, Shibuya-ku" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Opening Hours</label>
            <input className={inputCls} placeholder="e.g. Daily 8:00–22:00" value={form.opening_hours} onChange={e => set('opening_hours', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Latitude *</label>
              <input className={inputCls} type="number" step="any" placeholder="35.6762" value={form.lat} onChange={e => set('lat', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Longitude *</label>
              <input className={inputCls} type="number" step="any" placeholder="139.6503" value={form.lng} onChange={e => set('lng', e.target.value)} />
            </div>
          </div>
          <p className="text-[11px] text-gray-300 -mt-2">Right-click on Google Maps to copy coordinates.</p>

          <div>
            <label className={labelCls}>Website</label>
            <input className={inputCls} placeholder="https://..." value={form.website} onChange={e => set('website', e.target.value)} />
          </div>

          {error && <p className="text-[12px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-[13px] bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : mode === 'add' ? 'Add place' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
