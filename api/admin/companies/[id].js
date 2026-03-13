const { neon } = require('@neondatabase/serverless');
const { verifySession, isAdminEmail, hashPassword } = require('../../_lib/auth');

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

      return res.status(200).json({ members });
    }

    if (req.method === 'POST') {
      const { email, password } = req.body ?? {};
      if (!email?.trim()) {
        return res.status(400).json({ error: 'Email is required' });
      }
      if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const emailLower = email.trim().toLowerCase();

      // Check if user already exists
      const existing = await sql`
        SELECT id FROM neon_auth.user WHERE email = ${emailLower} LIMIT 1
      `;
      if (existing.length > 0) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }

      const now = new Date().toISOString();
      const hashedPassword = hashPassword(password);

      // Create user
      const [user] = await sql`
        INSERT INTO neon_auth.user (name, email, "emailVerified", "createdAt", "updatedAt")
        VALUES (${emailLower}, ${emailLower}, false, ${now}, ${now})
        RETURNING id
      `;

      // Create credential account
      await sql`
        INSERT INTO neon_auth.account ("accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        VALUES (${user.id}, 'credential', ${user.id}, ${hashedPassword}, ${now}, ${now})
      `;

      // Add to organization
      await sql`
        INSERT INTO neon_auth.member (id, "organizationId", "userId", role, "createdAt")
        VALUES (gen_random_uuid(), ${orgId}, ${user.id}, 'member', ${now})
      `;

      // Set must-change-password flag
      await sql`
        INSERT INTO public.user_flags (user_id, must_change_password)
        VALUES (${user.id}, true)
      `;

      return res.status(201).json({ id: user.id, email: emailLower });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin company detail error:', err);
    return res.status(500).json({ error: String(err) });
  }
};
