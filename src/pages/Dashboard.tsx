import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiBrochures, apiCompanySettings, apiCompanyAgents } from '../lib/api';
import { fetchOrgTemplates, type CompanyTemplate } from '../lib/adminApi';
import { rowToBrochure, settingsToClient } from '../lib/convert';
import { createDefaultBrochureForOrg } from '../utils/defaults';
import { templates } from '../components/pdf/templates';
import { isAdmin } from '../lib/admin';
import UserMenu from '../components/UserMenu';
import AdminBar from '../components/AdminBar';
import ActionButton from '../components/ActionButton';
import TemplatePickerModal from '../components/TemplatePickerModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import type { BrochureData } from '../types/brochure';
import type { BrochureRow } from '../lib/api';

interface DashboardProps {
  onEdit: (data: BrochureData) => void;
  onSettings: () => void;
  onAdmin: () => void;
}

export default function Dashboard({ onEdit, onSettings, onAdmin }: DashboardProps) {
  const { organization, user, signOut } = useAuth();
  const { toast } = useToast();
  const showAdmin = isAdmin(user?.email);
  const [rows, setRows] = useState<BrochureRow[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [templatePicker, setTemplatePicker] = useState<CompanyTemplate[] | null>(null);
  const [hasTemplates, setHasTemplates] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'edited'>('newest');

  const orgId = organization?.id ?? '';

  const reload = useCallback(async () => {
    if (!orgId) return;
    try {
      const list = await apiBrochures.list(orgId);
      setRows(list);
    } catch (err) {
      console.error('Failed to load brochures:', err);
      toast('Failed to load brochures', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Reset state when org changes, then reload
  useEffect(() => {
    setCompanyName(organization?.name ?? '');
    setRows([]);
    setLoading(true);
    setHasTemplates(true);
  }, [orgId, organization?.name]);

  // Load brochures + company name + template availability
  useEffect(() => {
    let cancelled = false;
    reload();
    if (orgId) {
      apiCompanySettings.get(orgId).then((s) => {
        if (cancelled) return;
        if (s?.agency_name) setCompanyName(s.agency_name);
        else setCompanyName(organization?.name ?? '');
      }).catch(() => {
        if (!cancelled) setCompanyName(organization?.name ?? '');
      });
      fetchOrgTemplates().then((tpls) => {
        if (!cancelled) setHasTemplates(tpls.length > 0);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [reload, orgId, organization?.name]);

  /** Create a brochure with a specific template */
  const createBrochure = async (templateId: string) => {
    if (!orgId || !user) return;
    try {
      const [settings, agents] = await Promise.all([
        apiCompanySettings.get(orgId),
        apiCompanyAgents.list(orgId),
      ]);
      const clientSettings = settingsToClient(settings, agents);
      const data = createDefaultBrochureForOrg(clientSettings, templateId);
      const row = await apiBrochures.create({
        organization_id: orgId,
        created_by: user.id,
        name: data.name,
        template_id: data.templateId,
        headline: data.headline,
        location_name: data.locationName,
        property_address: data.propertyAddress,
        location_description: data.locationDescription,
        rent: data.rent,
        premises_licence: data.premisesLicence,
        accommodation_description: data.accommodationDescription,
        accommodation_extra: data.accommodationExtra,
        accommodation: data.accommodation as unknown as unknown[],
        use_classes: data.useClasses,
        use_alternatives: data.useAlternatives,
        use_description: data.useDescription,
        lease: data.lease,
        rates: data.rates,
        legal_costs: data.legalCosts,
        viewings: data.viewings as unknown as unknown[],
        viewings_blurb: data.viewingsBlurb,
        epc: data.epc,
        map_url: data.mapUrl,
        disclaimer: data.disclaimer,
        hero_image_url: '',
        hero_image_position: { x: 50, y: 50 },
        hero_size: 'landscape',
        hero_zoom: 100,
        show_gallery: false,
        gallery_images: [],
        map_image_url: '',
      });
      if (row) {
        const brochure = rowToBrochure(row, settings, agents);
        onEdit(brochure);
      }
    } catch (err) {
      console.error('Failed to create brochure:', err);
      toast('Failed to create brochure', 'error');
    }
  };

  const handleNew = async () => {
    if (!orgId || !user) return;
    try {
      const companyTemplates = await fetchOrgTemplates();
      if (companyTemplates.length === 0) {
        // No templates assigned — can't create
        toast('No templates assigned to this company. Ask an admin to assign one.', 'warning');
        return;
      } else if (companyTemplates.length === 1) {
        // Single template — create immediately
        await createBrochure(companyTemplates[0].template_id);
      } else {
        // Multiple templates — show picker
        setTemplatePicker(companyTemplates);
      }
    } catch (err) {
      console.error('Failed to create brochure:', err);
      toast('Failed to create brochure', 'error');
    }
  };

  const handleEdit = async (row: BrochureRow) => {
    try {
      const [settings, agents] = await Promise.all([
        apiCompanySettings.get(orgId),
        apiCompanyAgents.list(orgId),
      ]);
      const brochure = rowToBrochure(row, settings, agents);
      onEdit(brochure);
    } catch (err) {
      console.error('Failed to load brochure:', err);
      toast('Failed to open brochure', 'error');
    }
  };

  const handleDuplicate = async (row: BrochureRow) => {
    try {
      const { id: _id, created_at: _ca, updated_at: _ua, created_by: _cb, ...rest } = row;
      await apiBrochures.create({ ...rest, name: `${row.name} (copy)`, created_by: user?.id ?? null });
      await reload();
    } catch (err) {
      console.error('Failed to duplicate brochure:', err);
      toast('Failed to duplicate brochure', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await apiBrochures.delete(deleteTarget.id);
    setDeleteTarget(null);
    await reload();
  };

  // Filter + sort brochures
  const filteredRows = useMemo(() => {
    let result = rows;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(q) ||
          (b.property_address || '').toLowerCase().includes(q),
      );
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === 'edited') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // newest
    });
  }, [rows, search, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* App header */}
      <header className="sticky top-0 z-20">
        {/* Admin bar (platform admins only) */}
        {showAdmin && <AdminBar onAdmin={onAdmin} />}

        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex items-center h-14 px-4 sm:px-6">
          {/* Brand */}
          <div className="min-w-0 flex flex-col -space-y-0.5">
            <span className="font-semibold text-gray-900 text-base truncate leading-tight">
              {companyName || organization?.name || 'Brochure Builder'}
            </span>
            <span className="text-[11px] text-gray-400 font-normal">
              Document designer
            </span>
          </div>

          <div className="flex-1" />

          {/* Settings */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            onClick={onSettings}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.7 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.7a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* User menu */}
          {user && (
            <UserMenu user={user} onSignOut={signOut} />
          )}
        </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">No brochures yet</h2>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">
                {hasTemplates
                  ? 'Create your first property brochure to get started. It only takes a few minutes.'
                  : 'No templates have been assigned to this company yet. Ask an admin to assign one.'}
              </p>
              {hasTemplates && (
              <button
                className="px-5 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors text-sm"
                onClick={handleNew}
              >
                Create your first brochure
              </button>
              )}
            </div>
          ) : (
            <>
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-400">My documents</h2>
                <button
                  className={`px-4 py-1.5 text-white text-sm font-medium rounded-lg transition-colors ${hasTemplates ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-300 cursor-not-allowed'}`}
                  onClick={handleNew}
                  disabled={!hasTemplates}
                  title={hasTemplates ? undefined : 'No templates assigned to this company'}
                >
                  New Document
                </button>
              </div>

              {/* Search + Sort */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 sm:max-w-xs">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search brochures..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-gray-300"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-[length:16px_16px] bg-[position:right_8px_center] bg-no-repeat"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 6L8 10L12 6' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")` }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="edited">Recently edited</option>
                </select>
              </div>

              {/* Cards */}
              {filteredRows.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No brochures match "{search}"</p>
              ) : (
              <div className="flex flex-col gap-2">
                {filteredRows.map((b) => (
                  <div
                    key={b.id}
                    className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:h-36"
                    onClick={() => handleEdit(b)}
                  >
                    {/* Hero thumbnail */}
                    {b.hero_image_url ? (
                      <div className="h-40 sm:h-auto sm:w-44 shrink-0 overflow-hidden bg-gray-100">
                        <img
                          src={b.hero_image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{
                            objectPosition: `${(b.hero_image_position as { x: number; y: number })?.x ?? 50}% ${(b.hero_image_position as { x: number; y: number })?.y ?? 50}%`,
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-28 sm:h-auto sm:w-44 shrink-0 bg-gray-50 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-200">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="8.5" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col justify-between gap-2.5">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{b.headline || b.name || 'Untitled'}</h3>
                        {b.location_name && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate font-medium">{b.location_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="3" width="12" height="11" rx="1.5" />
                              <path d="M2 6.5h12" />
                              <path d="M5.5 1.5v3M10.5 1.5v3" />
                            </svg>
                            {new Date(b.updated_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {b.template_id && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 truncate max-w-[140px]">
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M9 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V6L9 1.5z" />
                                <path d="M9 1.5V6h4.5" />
                              </svg>
                              {templates[b.template_id]?.name ?? b.template_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActionButton
                          label="Edit"
                          onClick={(e) => { e.stopPropagation(); handleEdit(b); }}
                          icon={
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" />
                            </svg>
                          }
                        />
                        <ActionButton
                          label="Duplicate"
                          onClick={(e) => { e.stopPropagation(); handleDuplicate(b); }}
                          icon={
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="5" width="9" height="9" rx="1.5" />
                              <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
                            </svg>
                          }
                        />
                        <ActionButton
                          label="Delete"
                          variant="danger"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: b.id, name: b.name }); }}
                          icon={
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                              <path d="M6.5 7v4M9.5 7v4" />
                            </svg>
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Template picker modal */}
      {templatePicker && (
        <TemplatePickerModal
          companyTemplates={templatePicker}
          onSelect={(templateId) => {
            setTemplatePicker(null);
            createBrochure(templateId);
          }}
          onClose={() => setTemplatePicker(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
