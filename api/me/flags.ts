import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession } from '../_lib/auth';

/**
 * GET /api/me/flags
 * Returns user flags (e.g. must_change_password).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = await verifySession(req.headers.authorization);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT must_change_password
      FROM public.user_flags
      WHERE user_id = ${session.userId}
      LIMIT 1
    `;

    return res.status(200).json({
      mustChangePassword: rows.length > 0 && rows[0].must_change_password === true,
    });
  } catch (err) {
    console.error('Flags error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
