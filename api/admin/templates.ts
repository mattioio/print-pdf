import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';
import { verifySession, isAdminEmail } from '../_lib/auth';

/**
 * GET    /api/admin/templates — list all templates with usage counts
 * POST   /api/admin/templates — create a new template
 * PATCH  /api/admin/templates — update template name/description
 * DELETE /api/admin/templates — delete template (if unused)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await verifySession(req.headers.authorization);
    if (!session || !isAdminEmail(session.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT
          t.id, t.name, t.description, t.created_at, t.updated_at,
          COUNT(DISTINCT ct.id)::int as usage_count
        FROM public.templates t
        LEFT JOIN public.company_templates ct ON ct.template_id = t.id
        GROUP BY t.id, t.name, t.description, t.created_at, t.updated_at
        ORDER BY t.created_at ASC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, description } = req.body ?? {};
      if (!name?.trim()) {
        return res.status(400).json({ error: 'Template name is required' });
      }

      const id = randomBytes(8).toString('hex');
      const now = new Date().toISOString();
      const desc = (description ?? '').trim();

      const [row] = await sql`
        INSERT INTO public.templates (id, name, description, created_at, updated_at)
        VALUES (${id}, ${name.trim()}, ${desc}, ${now}, ${now})
        RETURNING id, name, description, created_at, updated_at
      `;

      return res.status(201).json({ ...row, usage_count: 0 });
    }

    if (req.method === 'PATCH') {
      const { id, name, description } = req.body ?? {};
      if (!id) {
        return res.status(400).json({ error: 'Template id is required' });
      }

      const now = new Date().toISOString();
      const updates: Record<string, string> = {};
      if (name !== undefined) updates.name = name.trim();
      if (description !== undefined) updates.description = description.trim();

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nothing to update' });
      }

      const [row] = await sql`
        UPDATE public.templates
        SET
          name = COALESCE(${updates.name ?? null}, name),
          description = COALESCE(${updates.description ?? null}, description),
          updated_at = ${now}
        WHERE id = ${id}
        RETURNING id, name, description, created_at, updated_at
      `;

      if (!row) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.status(200).json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body ?? {};
      if (!id) {
        return res.status(400).json({ error: 'Template id is required' });
      }

      // Check if assigned to any company
      const [usage] = await sql`
        SELECT COUNT(*)::int as count FROM public.company_templates WHERE template_id = ${id}
      `;
      if (usage.count > 0) {
        return res.status(409).json({
          error: `Template is assigned to ${usage.count} company${usage.count !== 1 ? 'ies' : ''}. Remove assignments first.`,
        });
      }

      await sql`DELETE FROM public.templates WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin templates error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
