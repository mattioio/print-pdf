/**
 * Data API client — thin wrapper around fetch for the Neon Data API (PostgREST).
 * All requests include the user's JWT from the auth session.
 */
import { authClient } from './auth';

const DATA_API_URL = import.meta.env.VITE_DATA_API_URL;

async function getToken(): Promise<string> {
  const { data, error } = await authClient.token();
  if (error || !data?.token) throw new Error('Not authenticated');
  return data.token;
}

async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${DATA_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

/* ------------------------------------------------------------------ */
/*  Brochure helpers                                                  */
/* ------------------------------------------------------------------ */

export interface BrochureRow {
  id: string;
  organization_id: string;
  name: string;
  template_id: string;
  headline: string;
  location_name: string;
  property_address: string;
  location_description: string;
  rent: string;
  premises_licence: string;
  accommodation_description: string;
  accommodation_extra: string;
  accommodation: unknown[];
  use_classes: string[];
  use_alternatives: boolean;
  use_description: string;
  lease: string;
  rates: string;
  legal_costs: string;
  viewings: unknown[];
  viewings_blurb: string;
  epc: string;
  map_url: string;
  disclaimer: string;
  hero_image_url: string;
  hero_image_position: { x: number; y: number };
  hero_size: string;
  hero_zoom: number;
  show_gallery: boolean;
  gallery_images: unknown[];
  map_image_url: string;
  accent_color: string | null;
  text_color: string | null;
  title_font: string | null;
  body_font: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const apiBrochures = {
  list: (orgId: string) =>
    apiFetch<BrochureRow[]>(
      `/brochures?organization_id=eq.${orgId}&order=updated_at.desc`,
    ),

  get: (id: string) =>
    apiFetch<BrochureRow[]>(`/brochures?id=eq.${id}`).then((r) => r[0] ?? null),

  create: (data: Partial<BrochureRow>) =>
    apiFetch<BrochureRow[]>('/brochures', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Prefer: 'return=representation' },
    }).then((r) => r[0]),

  update: (id: string, data: Partial<BrochureRow>) =>
    apiFetch<BrochureRow[]>(`/brochures?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
      headers: { Prefer: 'return=representation' },
    }).then((r) => r[0]),

  delete: (id: string) =>
    apiFetch(`/brochures?id=eq.${id}`, { method: 'DELETE' }),
};

/* ------------------------------------------------------------------ */
/*  Company settings                                                  */
/* ------------------------------------------------------------------ */

export interface CompanySettingsRow {
  organization_id: string;
  agency_name: string;
  tagline: string;
  logo_url: string;
  address: string;
  telephone: string;
  fax: string;
  website: string;
  accent_color: string;
  text_color: string;
  title_font: string;
  body_font: string;
  template_id: string;
  updated_at: string;
}

export const apiCompanySettings = {
  get: (orgId: string) =>
    apiFetch<CompanySettingsRow[]>(
      `/company_settings?organization_id=eq.${orgId}`,
    ).then((r) => r[0] ?? null),

  upsert: (orgId: string, data: Partial<CompanySettingsRow>) =>
    apiFetch<CompanySettingsRow[]>('/company_settings', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        organization_id: orgId,
        updated_at: new Date().toISOString(),
      }),
      headers: {
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
    }).then((r) => r[0]),
};

/* ------------------------------------------------------------------ */
/*  Company agents (contact people)                                   */
/* ------------------------------------------------------------------ */

export interface CompanyAgentRow {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  sort_order: number;
}

// Guard against concurrent replace calls (delete + insert is not atomic)
let replaceInFlight: Promise<CompanyAgentRow[]> | null = null;

export const apiCompanyAgents = {
  list: (orgId: string) =>
    apiFetch<CompanyAgentRow[]>(
      `/company_agents?organization_id=eq.${orgId}&order=sort_order`,
    ),

  /** Replace all agents for an org (delete + insert) */
  replace: async (
    orgId: string,
    agents: { name: string; email: string }[],
  ): Promise<CompanyAgentRow[]> => {
    // Wait for any in-flight replace to finish before starting a new one
    if (replaceInFlight) {
      try { await replaceInFlight; } catch { /* ignore */ }
    }
    const doReplace = async () => {
      // Delete existing
      await apiFetch(`/company_agents?organization_id=eq.${orgId}`, {
        method: 'DELETE',
      });
      if (agents.length === 0) return [];
      // Insert new
      return apiFetch<CompanyAgentRow[]>('/company_agents', {
        method: 'POST',
        body: JSON.stringify(
          agents.map((a, i) => ({
            organization_id: orgId,
            name: a.name,
            email: a.email,
            sort_order: i,
          })),
        ),
        headers: { Prefer: 'return=representation' },
      });
    };
    replaceInFlight = doReplace();
    try {
      return await replaceInFlight;
    } finally {
      replaceInFlight = null;
    }
  },
};

/* ------------------------------------------------------------------ */
/*  Company templates (multi-template per company)                     */
/* ------------------------------------------------------------------ */

export interface CompanyTemplateRow {
  id: string;
  organization_id: string;
  template_id: string;
  display_name: string;
  sort_order: number;
  created_at: string;
}

export const apiCompanyTemplates = {
  list: (orgId: string) =>
    apiFetch<CompanyTemplateRow[]>(
      `/company_templates?organization_id=eq.${orgId}&order=sort_order`,
    ),

  create: (data: Omit<CompanyTemplateRow, 'id' | 'created_at'>) =>
    apiFetch<CompanyTemplateRow[]>('/company_templates', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Prefer: 'return=representation' },
    }).then((r) => r[0]),

  update: (id: string, data: Partial<CompanyTemplateRow>) =>
    apiFetch<CompanyTemplateRow[]>(`/company_templates?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Prefer: 'return=representation' },
    }).then((r) => r[0]),

  delete: (id: string) =>
    apiFetch(`/company_templates?id=eq.${id}`, { method: 'DELETE' }),
};

/* ------------------------------------------------------------------ */
/*  Image upload                                                      */
/* ------------------------------------------------------------------ */

export async function uploadImage(file: Blob, filename: string): Promise<string> {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', file, filename);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const { url } = await res.json();
  return url;
}
