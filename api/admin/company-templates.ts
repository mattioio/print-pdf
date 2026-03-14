import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession, isAdminEmail } from '../_lib/auth';

/**
 * GET    /api/admin/company-templates?orgId=xxx — list templates for a company
 * POST   /api/admin/company-templates — assign template to company
 * PATCH  /api/admin/company-templates — update display name
 * DELETE /api/admin/company-templates — remove assignment
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await verifySession(req.headers.authorization);
    if (!session || !isAdminEmail(session.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    if (req.method === 'GET') {
      const orgId = req.query.orgId as string;
      if (!orgId) return res.status(400).json({ error: 'orgId required' });

      const rows = await sql`
        SELECT * FROM public.company_templates
        WHERE organization_id = ${orgId}
        ORDER BY sort_order
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { organization_id, template_id, display_name, sort_order = 0 } = req.body ?? {};
      if (!organization_id || !template_id || !display_name?.trim()) {
        return res.status(400).json({ error: 'organization_id, template_id, display_name required' });
      }

      const [row] = await sql`
        INSERT INTO public.company_templates (organization_id, template_id, display_name, sort_order)
        VALUES (${organization_id}, ${template_id}, ${display_name.trim()}, ${sort_order})
        RETURNING *
      `;
      return res.status(201).json(row);
    }

    if (req.method === 'PATCH') {
      const { id, display_name } = req.body ?? {};
      if (!id || !display_name?.trim()) {
        return res.status(400).json({ error: 'id and display_name required' });
      }

      const [row] = await sql`
        UPDATE public.company_templates
        SET display_name = ${display_name.trim()}
        WHERE id = ${id}
        RETURNING *
      `;
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'id required' });

      await sql`DELETE FROM public.company_templates WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin company-templates error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
