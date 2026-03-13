import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession, isAdminEmail } from '../_lib/auth';

/**
 * GET  /api/admin/companies — list all companies with member counts
 * POST /api/admin/companies — create a new company
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = await verifySession(req.headers.authorization);
  if (!session || !isAdminEmail(session.email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = neon(process.env.DATABASE_URL!);

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT
        o.id, o.name, o.slug, o."createdAt",
        COALESCE(cs.template_id, 'classic') as template_id,
        COUNT(DISTINCT m.id)::int as member_count
      FROM neon_auth.organization o
      LEFT JOIN public.company_settings cs ON cs.organization_id = o.id
      LEFT JOIN neon_auth.member m ON m."organizationId" = o.id
      GROUP BY o.id, o.name, o.slug, o."createdAt", cs.template_id
      ORDER BY o."createdAt" DESC
    `;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { name, templateId = 'classic' } = req.body ?? {};
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const now = new Date().toISOString();

    // Create org
    const [org] = await sql`
      INSERT INTO neon_auth.organization (id, name, slug, "createdAt")
      VALUES (gen_random_uuid(), ${name.trim()}, ${slug}, ${now})
      RETURNING id, name, slug, "createdAt"
    `;

    // Add admin as owner
    await sql`
      INSERT INTO neon_auth.member (id, "organizationId", "userId", role, "createdAt")
      VALUES (gen_random_uuid(), ${org.id}, ${session.userId}, 'owner', ${now})
    `;

    // Seed company_settings
    await sql`
      INSERT INTO public.company_settings (organization_id, agency_name, template_id, updated_at)
      VALUES (${org.id}, ${name.trim()}, ${templateId}, ${now})
      ON CONFLICT (organization_id) DO UPDATE SET
        agency_name = EXCLUDED.agency_name,
        template_id = EXCLUDED.template_id,
        updated_at = EXCLUDED.updated_at
    `;

    return res.status(201).json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      template_id: templateId,
      member_count: 1,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
