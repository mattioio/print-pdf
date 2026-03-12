import { useState, useEffect, useRef, useCallback } from 'react';
import { loadAgencySettings, saveAgencySettings } from '../utils/agency';
import { FONT_OPTIONS } from '../components/pdf/shared/fonts';
import type { AgencySettings } from '../utils/agency';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );
}

export default function Settings({ open, onClose }: SettingsProps) {
  const [settings, setSettings] = useState<AgencySettings>(loadAgencySettings);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (open) {
      setAnimating(true);
      // Force a reflow before adding the visible class so the transition fires
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const id = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Re-load settings every time drawer opens
  useEffect(() => {
    if (open) setSettings(loadAgencySettings());
  }, [open]);

  // Auto-save
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveAgencySettings(settings);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [settings]);

  const updateAgency = useCallback((key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      agency: { ...prev.agency, [key]: value },
    }));
  }, []);

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback((file: File) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 200;
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        updateAgency('logoUrl', canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, [updateAgency]);

  const updateAgent = useCallback((index: number, field: 'name' | 'email', value: string) => {
    setSettings((prev) => {
      const agents = [...prev.agents];
      agents[index] = { ...agents[index], [field]: value };
      return { ...prev, agents };
    });
  }, []);

  const addAgent = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      agents: [...prev.agents, { name: '', email: '' }],
    }));
  }, []);

  const removeAgent = useCallback((index: number) => {
    setSettings((prev) => ({
      ...prev,
      agents: prev.agents.filter((_, i) => i !== index),
    }));
  }, []);

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none';
  const selectClass = inputClass + ' bg-white';

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
          <h2 className="text-lg font-semibold text-gray-900">Agency Settings</h2>
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
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Agency Details */}
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              These details appear on every brochure you create.
            </p>

            {/* Logo */}
            <div>
              <Label>Logo</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors overflow-hidden relative h-24 w-full"
                onClick={() => logoInputRef.current?.click()}
              >
                {settings.agency.logoUrl ? (
                  <>
                    <img
                      src={settings.agency.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                    />
                    <button
                      className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 hover:bg-red-600/90 z-10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAgency('logoUrl', '');
                      }}
                      title="Remove logo"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                        <path d="M6.5 7v4M9.5 7v4" />
                      </svg>
                      <span className="text-xs font-medium">Delete</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-0.5">
                    <span>Upload logo</span>
                    <span className="text-xs text-gray-300">Recommended: 800 × 200px or smaller. PNG or SVG.</span>
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div>
              <Label>Agency Name</Label>
              <input
                className={inputClass}
                value={settings.agency.name}
                onChange={(e) => updateAgency('name', e.target.value)}
              />
            </div>

            <div>
              <Label>Address</Label>
              <textarea
                className={inputClass + ' resize-y'}
                value={settings.agency.address}
                onChange={(e) => updateAgency('address', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telephone</Label>
                <input
                  className={inputClass}
                  value={settings.agency.telephone}
                  onChange={(e) => updateAgency('telephone', e.target.value)}
                />
              </div>
              <div>
                <Label>Fax</Label>
                <input
                  className={inputClass}
                  value={settings.agency.fax}
                  onChange={(e) => updateAgency('fax', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Website</Label>
              <input
                className={inputClass}
                value={settings.agency.website}
                onChange={(e) => updateAgency('website', e.target.value)}
              />
            </div>
          </div>

          {/* Agents */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900">Agents</h3>
              <button
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                onClick={addAgent}
              >
                + Add Agent
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Manage your team. Pick which agents to list on each brochure.
            </p>
            <div className="space-y-3">
              {settings.agents.map((agent, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={inputClass + ' !w-auto flex-1'}
                    value={agent.name}
                    onChange={(e) => updateAgent(i, 'name', e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    className={inputClass + ' !w-auto flex-1'}
                    value={agent.email}
                    onChange={(e) => updateAgent(i, 'email', e.target.value)}
                    placeholder="Email"
                  />
                  <button
                    className="text-gray-300 hover:text-red-500 text-sm transition-colors px-1"
                    onClick={() => removeAgent(i)}
                    title="Remove agent"
                  >
                    ×
                  </button>
                </div>
              ))}
              {settings.agents.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No agents yet. Click "+ Add Agent" to add your first team member.
                </p>
              )}
            </div>
          </div>

          {/* Branding */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Branding</h3>

            <div>
              <Label>Accent Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, accentColor: e.target.value }))
                  }
                  className="w-9 h-9 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  className={inputClass + ' !w-28 font-mono'}
                  value={settings.accentColor}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (!v.startsWith('#')) v = '#' + v;
                    v = '#' + v.slice(1).replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                    setSettings((prev) => ({ ...prev, accentColor: v }));
                  }}
                  placeholder="#000000"
                  title="Hex colour code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title Font</Label>
                <select
                  className={selectClass}
                  value={settings.titleFont}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, titleFont: e.target.value }))
                  }
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label} ({f.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Body Font</Label>
                <select
                  className={selectClass}
                  value={settings.bodyFont}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, bodyFont: e.target.value }))
                  }
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label} ({f.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 pt-2">
            Changes are saved automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
