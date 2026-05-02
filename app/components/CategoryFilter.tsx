'use client';
import { Category, CATEGORIES } from '../../types';
import CategoryIcon from './CategoryIcon';

interface Props {
  activeCategories: Set<Category>;
  onToggle: (cat: Category) => void;
  onToggleAll: () => void;
  counts: Record<string, number>;
}

export default function CategoryFilter({ activeCategories, onToggle, onToggleAll, counts }: Props) {
  const allOn = activeCategories.size === Object.keys(CATEGORIES).length;

  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.16em] text-gray-400">Categories</span>
        <button onClick={onToggleAll} className="text-[11px] text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors">
          {allOn ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(CATEGORIES) as [Category, { label: string; color: string }][]).map(([key, meta]) => {
          const on = activeCategories.has(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border text-[10.5px] font-medium tracking-wide transition-all duration-150"
              style={on
                ? { color: meta.color, borderColor: `${meta.color}55`, backgroundColor: `${meta.color}0e` }
                : { color: '#aaa', borderColor: '#e8e8e8', backgroundColor: '#fff' }
              }
            >
              <CategoryIcon category={key} size={11} />
              {meta.label}
              <span className="opacity-50">({counts[key] ?? 0})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
