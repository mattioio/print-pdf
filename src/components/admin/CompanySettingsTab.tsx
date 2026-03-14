import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi, type AdminCompanySettings, type AdminCompanyAgent } from '../../lib/adminApi';
import { uploadImage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FONT_OPTIONS } from '../pdf/shared/fonts';

const DEFAULT_SETTINGS: AdminCompanySettings = {
  agency_name: '',
  tagline: '',
  logo_url: '',
  address: '',
  telephone: '',
  fax: '',
  website: '',
  accent_color: '#f3b229',
  text_color: '#1a1a1a',
  title_font: 'Playfair Display',
  body_font: 'Montserrat',
};

interface Props {
  orgId: string;
  initialSettings: AdminCompanySettings | null;
  initialAgents: AdminCompanyAgent[];
  onAgencyNameChange?: (name: string) => void;
}

export default function CompanySettingsTab({ orgId, initialSettings, initialAgents, onAgencyNameChange }: Props) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminCompanySettings>(initialSettings ?? DEFAULT_SETTINGS);
  const [agents, setAgents] = useState<AdminCompanyAgent[]>(initialAgents);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadedRef = useRef(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Initialise from props (runs once when component mounts with data)
  useEffect(() => {
    if (!loadedRef.current) {
      setSettings(initialSettings ?? DEFAULT_SETTINGS);
      setAgents(initialAgents);
      loadedRef.current = true;
    }
  }, [initialSettings, initialAgents]);

  // Auto-save (debounced 500ms)
  useEffect(() => {
    if (!loadedRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      adminApi.updateCompanySettings(orgId, settings, agents).catch(() => {
        toast("Settings couldn't be saved", 'error');
      });
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [settings, agents, orgId]);

  const updateField = useCallback((key: keyof AdminCompanySettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === 'agency_name') onAgencyNameChange?.(value);
  }, [onAgencyNameChange]);

  const handleLogoUpload = useCallback(async (file: File) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 200;
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            const url = await uploadImage(blob, `logo-${orgId}.png`);
            updateField('logo_url', url);
          } catch {
            toast('Logo upload failed', 'error');
            updateField('logo_url', canvas.toDataURL('image/png'));
          }
        }, 'image/png');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, [updateField, orgId]);

  const updateAgent = useCallback((index: number, field: 'name' | 'email', value: string) => {
    setAgents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addAgent = useCallback(() => {
    setAgents((prev) => [...prev, { name: '', email: '' }]);
  }, []);

  const removeAgent = useCallback((index: number) => {
    setAgents((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none';

  return (
    <div className="space-y-5">
      {/* Logo */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Logo</label>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors overflow-hidden relative h-20 w-full"
          onClick={() => logoInputRef.current?.click()}
        >
          {settings.logo_url ? (
            <>
              <img
                src={settings.logo_url}
                alt="Logo"
                className="w-full h-full object-contain p-2"
              />
              <button
                className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm text-white rounded-full px-2 py-0.5 flex items-center gap-1 hover:bg-red-600/90 z-10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  updateField('logo_url', '');
                }}
                title="Remove logo"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                  <path d="M6.5 7v4M9.5 7v4" />
                </svg>
                <span className="text-[10px] font-medium">Delete</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs gap-0.5">
              <span>Upload logo</span>
              <span className="text-[10px] text-gray-300">800 x 200px max</span>
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

      {/* Agency Name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Agency Name</label>
        <input
          className={inputClass}
          value={settings.agency_name}
          onChange={(e) => updateField('agency_name', e.target.value)}
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
        <textarea
          className={inputClass + ' resize-y'}
          value={settings.address}
          onChange={(e) => updateField('address', e.target.value)}
          rows={2}
        />
      </div>

      {/* Telephone + Fax */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Telephone</label>
          <input
            className={inputClass}
            value={settings.telephone}
            onChange={(e) => updateField('telephone', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fax</label>
          <input
            className={inputClass}
            value={settings.fax}
            onChange={(e) => updateField('fax', e.target.value)}
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Website</label>
        <input
          className={inputClass}
          value={settings.website}
          onChange={(e) => updateField('website', e.target.value)}
        />
      </div>

      {/* Agents */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-500">Agents</label>
          <span className="text-[10px] text-gray-400">{agents.length} {agents.length === 1 ? 'agent' : 'agents'}</span>
        </div>
        <p className="text-[10px] text-gray-400 mb-3">Team members who appear on documents.</p>
        <div className="space-y-2">
          {agents.map((agent, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 group hover:border-gray-300 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                  {agent.name ? agent.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    className={inputClass}
                    value={agent.name}
                    onChange={(e) => updateAgent(i, 'name', e.target.value)}
                    placeholder="Full name"
                  />
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 shrink-0">
                      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                      <path d="M1.5 5l6.5 4 6.5-4" />
                    </svg>
                    <input
                      className={inputClass}
                      value={agent.email}
                      onChange={(e) => updateAgent(i, 'email', e.target.value)}
                      placeholder="email@company.com"
                      type="email"
                    />
                  </div>
                </div>
                <button
                  className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => removeAgent(i)}
                  title="Remove agent"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                    <path d="M6.5 7v4M9.5 7v4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg py-4 text-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto mb-1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
              </svg>
              <p className="text-xs text-gray-400">No agents yet</p>
            </div>
          )}
        </div>
        <button
          className="mt-2 w-full py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50 transition-colors flex items-center justify-center gap-1.5"
          onClick={addAgent}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add agent
        </button>
      </div>

      {/* Branding */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <label className="text-xs font-medium text-gray-500">Branding</label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accent_color}
                onChange={(e) => updateField('accent_color', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                className={inputClass + ' !w-24 font-mono text-xs'}
                value={settings.accent_color}
                onChange={(e) => {
                  let v = e.target.value;
                  if (!v.startsWith('#')) v = '#' + v;
                  v = '#' + v.slice(1).replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                  updateField('accent_color', v);
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.text_color}
                onChange={(e) => updateField('text_color', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                className={inputClass + ' !w-24 font-mono text-xs'}
                value={settings.text_color}
                onChange={(e) => {
                  let v = e.target.value;
                  if (!v.startsWith('#')) v = '#' + v;
                  v = '#' + v.slice(1).replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                  updateField('text_color', v);
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Title Font</label>
            <select
              className={inputClass + ' bg-white text-xs'}
              value={settings.title_font}
              onChange={(e) => updateField('title_font', e.target.value)}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.category})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">Body Font</label>
            <select
              className={inputClass + ' bg-white text-xs'}
              value={settings.body_font}
              onChange={(e) => updateField('body_font', e.target.value)}
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

      <p className="text-[10px] text-gray-300 pt-1">
        Changes are saved automatically.
      </p>
    </div>
  );
}
