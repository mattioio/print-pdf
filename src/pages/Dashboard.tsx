import { useState, useEffect, useMemo } from 'react';
import { listBrochures, deleteBrochure, duplicateBrochure } from '../utils/storage';
import { loadImage } from '../utils/imageStore';
import { loadAgencySettings } from '../utils/agency';
import type { BrochureData } from '../types/brochure';

interface DashboardProps {
  onNew: () => void;
  onEdit: (id: string) => void;
  onSettings: () => void;
}

export default function Dashboard({ onNew, onEdit, onSettings }: DashboardProps) {
  const [brochures, setBrochures] = useState<BrochureData[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const agency = useMemo(() => loadAgencySettings(), []);

  useEffect(() => {
    setBrochures(listBrochures());
  }, []);

  // Load hero thumbnails from IndexedDB
  useEffect(() => {
    if (brochures.length === 0) return;
    Promise.all(
      brochures.map(async (b) => {
        if (b.heroImageUrl) return [b.id, b.heroImageUrl] as const;
        const img = await loadImage(`${b.id}:heroImageUrl`);
        return [b.id, img ?? ''] as const;
      })
    ).then((entries) => {
      setThumbs(Object.fromEntries(entries.filter(([, v]) => v)));
    });
  }, [brochures]);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteBrochure(deleteTarget.id);
    setBrochures(listBrochures());
    setDeleteTarget(null);
  };

  const handleDuplicate = async (id: string) => {
    await duplicateBrochure(id);
    setBrochures(listBrochures());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex items-center h-14 px-6">
          {/* Brand */}
          <div className="min-w-0 flex flex-col -space-y-0.5">
            <span className="font-semibold text-gray-900 text-base truncate leading-tight">
              {agency.agency.name}
            </span>
            <span className="text-[11px] text-gray-400 font-normal">
              Brochure creator
            </span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            onClick={onSettings}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.7 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.7a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {brochures.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                No brochures yet
              </h2>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">
                Create your first property brochure to get started. It only takes a few minutes.
              </p>
              <button
                className="px-5 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors text-sm"
                onClick={onNew}
              >
                Create your first brochure
              </button>
            </div>
          ) : (
            <>
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-400">
                  My brochures
                </h2>
                <button
                  className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  onClick={onNew}
                >
                  New Brochure
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {brochures.map((b) => (
                  <div
                    key={b.id}
                    className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group flex h-36"
                    onClick={() => onEdit(b.id)}
                  >
                    {/* Hero thumbnail */}
                    {(thumbs[b.id] || b.heroImageUrl) ? (
                      <div className="w-44 shrink-0 overflow-hidden bg-gray-100">
                        <img
                          src={thumbs[b.id] || b.heroImageUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{
                            objectPosition: `${b.heroImagePosition?.x ?? 50}% ${b.heroImagePosition?.y ?? 50}%`,
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-44 shrink-0 bg-gray-50 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-200">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="8.5" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 px-5 py-3.5 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {b.name || 'Untitled'}
                        </h3>
                        {b.propertyAddress && (
                          <p className="text-sm text-gray-400 mt-0.5 truncate">
                            {b.propertyAddress}
                          </p>
                        )}
                        <p className="text-xs text-gray-300 mt-1">
                          {new Date(b.updatedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="flex items-center gap-1.5 bg-black/5 hover:bg-amber-500 text-gray-400 hover:text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(b.id);
                          }}
                        >
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="flex items-center gap-1.5 bg-black/5 hover:bg-gray-600 text-gray-400 hover:text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(b.id);
                          }}
                        >
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" />
                            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
                          </svg>
                          Duplicate
                        </button>
                        <button
                          className="flex items-center gap-1.5 bg-black/5 hover:bg-red-600 text-gray-400 hover:text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(b.id, b.name);
                          }}
                        >
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                            <path d="M6.5 7v4M9.5 7v4" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                <path d="M6.5 7v4M9.5 7v4" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete brochure</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.name || 'Untitled'}</strong>? This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
