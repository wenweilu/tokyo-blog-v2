'use client';
import { Place, CATEGORIES } from '../../types';
import CategoryIcon from './CategoryIcon';

interface Props {
  place: Place;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PlaceCard({ place, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave, onEdit, onDelete }: Props) {
  const meta = CATEGORIES[place.category];
  const active = isSelected || isHovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative border-b border-gray-100 py-5 px-6 cursor-pointer transition-all duration-150 border-l-2 ${active ? 'bg-gray-50/80' : 'bg-white hover:bg-gray-50/50'}`}
      style={{ borderLeftColor: isSelected ? meta.color : 'transparent' }}
    >
      {/* Action buttons — appear on hover */}
      <div
        className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-gray-300 hover:text-gray-700 hover:bg-gray-100 transition-all"
          title="Edit"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Delete"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2 pr-16">
        <span className="flex-shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
          <CategoryIcon category={place.category} size={13} />
        </span>
        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[16px] leading-tight text-gray-900 tracking-tight">
          {place.name}
        </h3>
        <span className="flex-shrink-0 text-[9px] uppercase tracking-[0.14em] font-medium" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {/* Intro */}
      {place.introduction && (
        <p className="text-[12.5px] leading-relaxed text-gray-500 mb-3 line-clamp-2">{place.introduction}</p>
      )}

      {/* Meta */}
      <div className="space-y-1">
        {place.opening_hours && (
          <div className="flex items-start gap-2">
            <svg className="flex-shrink-0 mt-[3px] text-gray-300" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p className="text-[11px] text-gray-400 leading-relaxed">{place.opening_hours}</p>
          </div>
        )}
        {place.address && (
          <div className="flex items-start gap-2">
            <svg className="flex-shrink-0 mt-[3px] text-gray-300" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <p className="text-[11px] text-gray-400 leading-relaxed">{place.address}</p>
          </div>
        )}
        {place.website && (
          <div className="flex items-start gap-2">
            <svg className="flex-shrink-0 mt-[3px] text-gray-300" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <a href={place.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[11px] text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors leading-relaxed truncate">{place.website.replace(/^https?:\/\//, '')}</a>
          </div>
        )}
      </div>
    </div>
  );
}
