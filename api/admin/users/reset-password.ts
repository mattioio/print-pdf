import { withAdmin } from '../../_lib/auth';
import { hashPassword } from '../../_lib/password';

/**
 * POST /api/admin/users/reset-password
 * Body: { userId, password }
 *
 * Admin-only: resets a user's password and sets the must_change_password flag.
 */
export default withAdmin(async (req, res, _session, sql) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, password } = req.body ?? {};
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const hashed = hashPassword(password);

  // Update password in neon_auth.account (credential provider)
  const updated = await sql`
    UPDATE neon_auth.account
    SET password = ${hashed}, "updatedAt" = now()
    WHERE "userId" = ${userId} AND "providerId" = 'credential'
    RETURNING id
  `;

  if (updated.length === 0) {
    return res.status(404).json({ error: 'User credential account not found' });
  }

  // Set must_change_password flag
  await sql`
    INSERT INTO public.user_flags (user_id, must_change_password)
    VALUES (${userId}, true)
    ON CONFLICT (user_id)
    DO UPDATE SET must_change_password = true
  `;

  return res.status(200).json({ success: true });
});
