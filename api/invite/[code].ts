import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession } from '../_lib/auth';

/**
 * GET  /api/invite/:code — validate an invite and return org name + email
 * POST /api/invite/:code — accept an invite (add authenticated user to org)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;
  if (!code) return res.status(400).json({ error: 'Missing invite code' });

  const sql = neon(process.env.DATABASE_URL!);

  if (req.method === 'GET') {
    // Public — no auth required. Returns org name + pre-fill email.
    const rows = await sql`
      SELECT pi.email, pi.name, pi.used_at, o.name as org_name
      FROM public.platform_invitations pi
      JOIN neon_auth.organization o ON o.id = pi.organization_id
      WHERE pi.code = ${code}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (rows[0].used_at) {
      return res.status(410).json({ error: 'This invitation has already been used' });
    }

    return res.status(200).json({
      email: rows[0].email,
      name: rows[0].name || null,
      orgName: rows[0].org_name,
    });
  }

  if (req.method === 'POST') {
    // Requires auth — user just signed up, now we add them to the org.
    const session = await verifySession(req.headers.authorization);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Look up the invitation
    const invites = await sql`
      SELECT id, organization_id, email, used_at
      FROM public.platform_invitations
      WHERE code = ${code}
      LIMIT 1
    `;

    if (invites.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const invite = invites[0];

    if (invite.used_at) {
      return res.status(410).json({ error: 'This invitation has already been used' });
    }

    // Verify email matches
    if (invite.email.toLowerCase() !== session.email.toLowerCase()) {
      return res.status(403).json({
        error: 'This invitation was sent to a different email address',
      });
    }

    // Check if already a member
    const existing = await sql`
      SELECT id FROM neon_auth.member
      WHERE "organizationId" = ${invite.organization_id}
        AND "userId" = ${session.userId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      // Add user to org
      await sql`
        INSERT INTO neon_auth.member (id, "organizationId", "userId", role, "createdAt")
        VALUES (gen_random_uuid(), ${invite.organization_id}, ${session.userId}, 'member', now())
      `;
    }

    // Mark invite as used
    await sql`
      UPDATE public.platform_invitations
      SET used_at = now()
      WHERE id = ${invite.id}
    `;

    return res.status(200).json({ success: true, organizationId: invite.organization_id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
