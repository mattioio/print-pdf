import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { verifySession } from '../_lib/auth';
import { hashPassword, verifyPassword } from '../_lib/password';

/**
 * POST /api/me/change-password
 * Body: { currentPassword, newPassword }
 *
 * Verifies the current password, updates to the new one, and clears
 * the must_change_password flag if set.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = await verifySession(req.headers.authorization);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Get current stored password
    const accounts = await sql`
      SELECT password
      FROM neon_auth.account
      WHERE "userId" = ${session.userId} AND "providerId" = 'credential'
      LIMIT 1
    `;

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Credential account not found' });
    }

    const stored = accounts[0].password as string;
    if (!verifyPassword(currentPassword, stored)) {
      return res.status(403).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const hashed = hashPassword(newPassword);
    await sql`
      UPDATE neon_auth.account
      SET password = ${hashed}, "updatedAt" = now()
      WHERE "userId" = ${session.userId} AND "providerId" = 'credential'
    `;

    // Clear the must_change_password flag
    await sql`
      DELETE FROM public.user_flags
      WHERE user_id = ${session.userId}
    `;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
