const { neon } = require('@neondatabase/serverless');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function verifySession(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const sql = neon(process.env.DATABASE_URL);

  const rows = await sql`
    SELECT s."userId", u.email, m."organizationId"
    FROM neon_auth.session s
    JOIN neon_auth.user u ON u.id = s."userId"
    LEFT JOIN neon_auth.member m ON m."userId" = s."userId"
    WHERE s.token = ${token}
      AND s."expiresAt" > now()
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return {
    userId: rows[0].userId,
    email: rows[0].email,
    organizationId: rows[0].organizationId ?? null,
  };
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

module.exports = { verifySession, isAdminEmail };
