/**
 * Shared serverless auth helpers.
 * Verifies session tokens against neon_auth.session and optionally checks admin status.
 */
import { neon } from '@neondatabase/serverless';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface SessionInfo {
  userId: string;
  email: string;
  organizationId: string | null;
}

/**
 * Verify a Bearer token and return session info.
 * Returns null if the token is invalid or expired.
 */
export async function verifySession(authHeader: string | undefined): Promise<SessionInfo | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT s."userId", u.email, s."activeOrganizationId" as "organizationId"
    FROM neon_auth.session s
    JOIN neon_auth.user u ON u.id = s."userId"
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

/**
 * Check if an email is a platform admin.
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Higher-order handler that verifies admin session + creates SQL client.
 * Wraps the common pattern of auth check + try/catch used by all admin endpoints.
 */
export function withAdmin(
  fn: (
    req: import('@vercel/node').VercelRequest,
    res: import('@vercel/node').VercelResponse,
    session: SessionInfo,
    sql: ReturnType<typeof neon>,
  ) => Promise<void | import('@vercel/node').VercelResponse>,
) {
  return async (
    req: import('@vercel/node').VercelRequest,
    res: import('@vercel/node').VercelResponse,
  ) => {
    try {
      const session = await verifySession(req.headers.authorization);
      if (!session || !isAdminEmail(session.email)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const sql = neon(process.env.DATABASE_URL!);
      return await fn(req, res, session, sql);
    } catch (err) {
      console.error('Admin API error:', err);
      return res.status(500).json({ error: String(err) });
    }
  };
}
