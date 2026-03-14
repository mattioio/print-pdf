import { randomBytes } from 'crypto';
import { withAdmin } from '../../_lib/auth';

/**
 * GET  /api/admin/companies/:id — list members for a company
 * POST /api/admin/companies/:id — create an invitation for a company
 */
export default withAdmin(async (req, res, session, sql) => {
  const orgId = req.query.id as string;
  if (!orgId) return res.status(400).json({ error: 'Missing company id' });

  if (req.method === 'GET') {
    // List members
    const members = await sql`
      SELECT u.id, u.name, u.email, u.image, m.role, m."createdAt"
      FROM neon_auth.member m
      JOIN neon_auth.user u ON u.id = m."userId"
      WHERE m."organizationId" = ${orgId}
        AND m."userId" != ${session.userId}
      ORDER BY m."createdAt"
    `;

    // List pending invitations
    const invitations = await sql`
      SELECT id, code, email, created_at, used_at
      FROM public.platform_invitations
      WHERE organization_id = ${orgId}
      ORDER BY created_at DESC
    `;

    return res.status(200).json({ members, invitations });
  }

  if (req.method === 'POST') {
    // Create invitation
    const { email, name } = req.body ?? {};
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const code = randomBytes(16).toString('hex');

    const [invite] = await sql`
      INSERT INTO public.platform_invitations (code, organization_id, email, name, created_by)
      VALUES (${code}, ${orgId}, ${email.trim().toLowerCase()}, ${name?.trim() || null}, ${session.userId})
      RETURNING id, code, email, name, created_at
    `;

    return res.status(201).json(invite);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
