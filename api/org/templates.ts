import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession } from '../_lib/auth';

/**
 * GET /api/org/templates — list templates assigned to the user's organization
 * Authenticated (any logged-in user), scoped to their own org.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await verifySession(req.headers.authorization);
    if (!session || !session.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const rows = await sql`
      SELECT ct.id, ct.organization_id, ct.template_id, ct.display_name, ct.sort_order, ct.created_at
      FROM public.company_templates ct
      WHERE ct.organization_id = ${session.organizationId}
      ORDER BY ct.sort_order
    `;

    return res.status(200).json(rows);
  } catch (err) {
    console.error('Org templates error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
