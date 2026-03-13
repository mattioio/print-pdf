/**
 * Admin API client — used by the Admin panel to manage companies and users.
 * All requests include the user's JWT.
 */
import { authClient } from './auth';

async function getToken(): Promise<string> {
  const { data } = await authClient.getSession();
  if (!data?.session?.token) throw new Error('Not authenticated');
  return data.session.token;
}

async function adminFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Admin API ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Company {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  template_id: string;
  member_count: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  code: string;
  email: string;
  created_at: string;
  used_at: string | null;
}

/* ------------------------------------------------------------------ */
/*  API methods                                                        */
/* ------------------------------------------------------------------ */

export const adminApi = {
  listCompanies: () =>
    adminFetch<Company[]>('/api/admin/companies'),

  createCompany: (name: string, templateId: string) =>
    adminFetch<Company>('/api/admin/companies', {
      method: 'POST',
      body: JSON.stringify({ name, templateId }),
    }),

  getCompanyMembers: (orgId: string) =>
    adminFetch<{ members: Member[]; invitations: Invitation[] }>(
      `/api/admin/companies/${orgId}`,
    ),

  inviteUser: (orgId: string, email: string) =>
    adminFetch<Invitation>(`/api/admin/companies/${orgId}`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

/* ------------------------------------------------------------------ */
/*  Invite validation (public — no auth needed)                        */
/* ------------------------------------------------------------------ */

export async function validateInvite(code: string): Promise<{ email: string; orgName: string }> {
  const res = await fetch(`/api/invite/${code}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Invalid invite' }));
    throw new Error(body.error || 'Invalid invite');
  }
  return res.json();
}

export async function acceptInvite(code: string): Promise<void> {
  const token = await getToken();
  const res = await fetch(`/api/invite/${code}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Failed to accept invite' }));
    throw new Error(body.error || 'Failed to accept invite');
  }
}
