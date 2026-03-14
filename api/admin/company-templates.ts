import { withAdmin } from '../_lib/auth';

/**
 * GET    /api/admin/company-templates?orgId=xxx — list templates for a company
 * POST   /api/admin/company-templates — assign template to company
 * DELETE /api/admin/company-templates — remove assignment
 */
export default withAdmin(async (req, res, _session, sql) => {
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
    const { organization_id, template_id, sort_order = 0 } = req.body ?? {};
    if (!organization_id || !template_id) {
      return res.status(400).json({ error: 'organization_id and template_id required' });
    }

    // Get template display_name
    const [tpl] = await sql`SELECT display_name FROM public.templates WHERE id = ${template_id}`;
    if (!tpl) return res.status(400).json({ error: 'Template not found' });

    const [row] = await sql`
      INSERT INTO public.company_templates (organization_id, template_id, display_name, sort_order)
      VALUES (${organization_id}, ${template_id}, ${tpl.display_name}, ${sort_order})
      RETURNING *
    `;
    return res.status(201).json(row);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id required' });

    await sql`DELETE FROM public.company_templates WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
