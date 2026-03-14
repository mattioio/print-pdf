import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface AdminBarProps {
  onAdmin: () => void;
}

export default function AdminBar({ onAdmin }: AdminBarProps) {
  const { organization, organizations, setActiveOrganization } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSwitch = async (orgId: string) => {
    if (orgId === organization?.id) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    setOpen(false);
    try {
      await setActiveOrganization(orgId);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200/60">
      <div className="max-w-5xl mx-auto flex items-center h-9 px-6 gap-3">
        {/* Left: shield + company switcher */}
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Admin</span>
        </div>

        {/* Company switcher */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
            onClick={() => setOpen((v) => !v)}
            disabled={switching}
          >
            {switching ? (
              <span className="text-amber-600">Switching...</span>
            ) : (
              <>
                <span className="truncate max-w-[200px]">{organization?.name ?? 'Select company'}</span>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`text-amber-500 transition-transform ${open ? 'rotate-180' : ''}`}>
                  <polyline points="3 5 7 9 11 5" />
                </svg>
              </>
            )}
          </button>

          {open && organizations.length > 0 && (
            <div
              className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-72 overflow-y-auto"
              style={{ animation: 'userMenuIn 0.15s ease-out' }}
            >
              {organizations.map((org) => (
                <button
                  key={org.id}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                    org.id === organization?.id
                      ? 'bg-amber-50 text-amber-800 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSwitch(org.id)}
                >
                  <span className="truncate flex-1">{org.name}</span>
                  {org.id === organization?.id && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
                      <polyline points="2 8 6 12 14 4" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Right: Admin Panel link */}
        <button
          className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
          onClick={onAdmin}
        >
          Admin Panel
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 2 10 7 5 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
