import { useState, useEffect, type ReactNode } from 'react';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const id = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!open && !animating) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Scrim */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
          <button
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
