'use client';
import { useState } from 'react';
import { Place } from '../../types';

interface Props {
  place: Place;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({ place, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-[380px] mx-4 overflow-hidden shadow-2xl shadow-black/10">
        <div className="px-6 pt-6 pb-4">
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-[19px] text-gray-900 mb-2">Delete place</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            Are you sure you want to delete <span className="text-gray-800 font-medium">{place.name}</span>? This cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 text-[13px] bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
