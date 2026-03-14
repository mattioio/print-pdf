import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession, isAdminEmail } from '../../_lib/auth';

/**
 * DELETE /api/admin/users/:id — remove a member from their organization
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await verifySession(req.headers.authorization);
    if (!session || !isAdminEmail(session.email)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = req.query.id as string;
    if (!userId) return res.status(400).json({ error: 'Missing user id' });

    const sql = neon(process.env.DATABASE_URL!);

    if (req.method === 'DELETE') {
      const { organizationId } = req.body ?? {};
      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId is required' });
      }

      // Remove from org membership
      await sql`
        DELETE FROM neon_auth.member
        WHERE "userId" = ${userId} AND "organizationId" = ${organizationId}
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin user error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
