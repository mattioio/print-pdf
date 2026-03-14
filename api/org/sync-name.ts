import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession } from '../_lib/auth';

/**
 * POST /api/org/sync-name — sync organization display name from agency_name
 * Body: { orgId, name }
 * Updates neon_auth.organization.name so it stays in sync with company_settings.agency_name
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await verifySession(req.headers.authorization);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { orgId, name } = req.body ?? {};
    if (!orgId || !name?.trim()) {
      return res.status(400).json({ error: 'orgId and name are required' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Verify the user is a member of this org
    const [membership] = await sql`
      SELECT 1 FROM neon_auth.member
      WHERE "organizationId" = ${orgId} AND "userId" = ${session.userId}
    `;
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    // Update the org name
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
