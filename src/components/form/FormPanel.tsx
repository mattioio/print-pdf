import { useState, useEffect } from 'react';
import { useBrochure } from '../../context/BrochureContext';
import PropertySection from './sections/PropertySection';
import AccommodationSection from './sections/AccommodationSection';
import UseSection from './sections/UseSection';
import Page2Section from './sections/Page2Section';
import ViewingsSection from './sections/ViewingsSection';
import FooterSection from './sections/FooterSection';

function formatSavedTime(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diffS = Math.round((now.getTime() - date.getTime()) / 1000);
  if (diffS < 5) return 'Saved just now';
  if (diffS < 60) return `Saved ${diffS}s ago`;
  const diffM = Math.round(diffS / 60);
  if (diffM < 60) return `Saved ${diffM}m ago`;
  return `Saved at ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function FormPanel() {
  const { undo, redo, canUndo, canRedo, lastSavedAt } = useBrochure();

  // Tick the saved-time display every 10s so it stays fresh
  const [, tick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, [lastSavedAt]);

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Editor toolbar */}
      <div className="flex items-center gap-1 px-4 h-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        {/* Undo / Redo */}
        <button
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-default"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5.5h5.5a3 3 0 0 1 0 6H7" />
            <polyline points="5.5 3 3 5.5 5.5 8" />
          </svg>
        </button>
        <button
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-default"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (⌘⇧Z)"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5.5H5.5a3 3 0 0 0 0 6H7" />
            <polyline points="8.5 3 11 5.5 8.5 8" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* Last saved */}
        {lastSavedAt && (
          <span className="text-[11px] text-gray-400 select-none">
            {formatSavedTime(lastSavedAt)}
          </span>
        )}
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <PropertySection />
        <AccommodationSection />
        <UseSection />
        <Page2Section />
        <ViewingsSection />
        <FooterSection />
        <div className="h-8" />
      </div>
    </div>
  );
}
