export type Category =
  | 'restaurant'
  | 'drink'
  | 'coffee'
  | 'hair_salon'
  | 'gallery_museum'
  | 'shopping'
  | 'music'
  | 'other';

export interface Place {
  id: string;
  name: string;
  category: Category;
  introduction: string;
  address: string;
  opening_hours: string;
  lat: number;
  lng: number;
  website?: string;
}

export interface CategoryMeta {
  label: string;
  color: string;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  restaurant:     { label: 'Restaurant',       color: '#B5896A' },
  drink:          { label: 'Drink',            color: '#6A8BA0' },
  coffee:         { label: 'Coffee',           color: '#8A7260' },
  hair_salon:     { label: 'Hair Salon',       color: '#8A7A9A' },
  gallery_museum: { label: 'Gallery & Museum', color: '#6A7D6A' },
  shopping:       { label: 'Shopping',         color: '#9A7878' },
  music:          { label: 'Music',            color: '#687890' },
  other:          { label: 'Other',            color: '#888878' },
};
