import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession, isAdminEmail } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  if (action === 'sync-name') {
    return handleSyncName(req, res);
  }
  if (action === 'templates') {
    return handleTemplates(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}

/**
 * POST /api/org/sync-name — sync organization display name from agency_name
 */
async function handleSyncName(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await verifySession(req.headers.authorization);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    const { orgId, name } = req.body ?? {};
    if (!orgId || !name?.trim()) return res.status(400).json({ error: 'orgId and name are required' });

    const sql = neon(process.env.DATABASE_URL!);

    const [membership] = await sql`
      SELECT 1 FROM neon_auth.member
      WHERE "organizationId" = ${orgId} AND "userId" = ${session.userId}
    `;
    if (!membership) return res.status(403).json({ error: 'Not a member of this organization' });

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await sql`
      UPDATE neon_auth.organization
      SET name = ${name.trim()}, slug = ${slug}
      WHERE id = ${orgId}
    `;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Sync org name error:', err);
    return res.status(500).json({ error: String(err) });
  }
}

/**
 * GET /api/org/templates — list templates assigned to the user's organization
 */
async function handleTemplates(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const session = await verifySession(req.headers.authorization);
    if (!session || !session.organizationId) return res.status(403).json({ error: 'Forbidden' });

    const sql = neon(process.env.DATABASE_URL!);
    const admin = isAdminEmail(session.email);

    const rows = admin
      ? await sql`
          SELECT ct.id, ct.organization_id, ct.template_id, t.display_name, t.status, ct.sort_order, ct.created_at
          FROM public.company_templates ct
          JOIN public.templates t ON t.id = ct.template_id
          WHERE ct.organization_id = ${session.organizationId}
          ORDER BY ct.sort_order
        `
      : await sql`
          SELECT ct.id, ct.organization_id, ct.template_id, t.display_name, t.status, ct.sort_order, ct.created_at
          FROM public.company_templates ct
          JOIN public.templates t ON t.id = ct.template_id
          WHERE ct.organization_id = ${session.organizationId}
            AND t.status = 'published'
          ORDER BY ct.sort_order
        `;

    return res.status(200).json(rows);
  } catch (err) {
    console.error('Org templates error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
