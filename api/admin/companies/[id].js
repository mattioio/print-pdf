const { neon } = require('@neondatabase/serverless');
const { randomBytes } = require('crypto');
const { verifySession, isAdminEmail } = require('../../_lib/auth');

module.exports = async function handler(req, res) {
  try {
    const session = await verifySession(req.headers.authorization);
    if (!session || !isAdminEmail(session.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const orgId = req.query.id;
    if (!orgId) return res.status(400).json({ error: 'Missing company id' });

    const sql = neon(process.env.DATABASE_URL);

    if (req.method === 'GET') {
      const members = await sql`
        SELECT u.id, u.name, u.email, u.image, m.role, m."createdAt"
        FROM neon_auth.member m
        JOIN neon_auth.user u ON u.id = m."userId"
        WHERE m."organizationId" = ${orgId}
        ORDER BY m."createdAt"
      `;

      const invitations = await sql`
        SELECT id, code, email, created_at, used_at
        FROM public.platform_invitations
        WHERE organization_id = ${orgId}
        ORDER BY created_at DESC
      `;

      return res.status(200).json({ members, invitations });
    }

    if (req.method === 'POST') {
      const { email } = req.body ?? {};
      if (!email?.trim()) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const code = randomBytes(16).toString('hex');

      const [invite] = await sql`
        INSERT INTO public.platform_invitations (code, organization_id, email, created_by)
        VALUES (${code}, ${orgId}, ${email.trim().toLowerCase()}, ${session.userId})
        RETURNING id, code, email, created_at
      `;

      return res.status(201).json(invite);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin company detail error:', err);
    return res.status(500).json({ error: String(err) });
  }
};
