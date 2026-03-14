import type { ReactNode } from 'react';
import { useToast } from '../context/ToastContext';
import type { ToastType } from '../context/ToastContext';

const icons: Record<ToastType, ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 8.5l2 2 3.5-4" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M10 6L6 10M6 6l4 4" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L1.5 13h13L8 2z" />
      <path d="M8 6v3M8 11.5v.5" />
    </svg>
  ),
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
};

export default function ToastStack() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg ${bgColors[t.type]}`}
          style={{ animation: 'toastIn 0.25s ease-out' }}
        >
          {icons[t.type]}
          <span className="text-sm text-gray-800 font-medium max-w-xs">{t.message}</span>
          <button
            className="ml-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            onClick={() => dismiss(t.id)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
