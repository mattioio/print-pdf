const { neon } = require('@neondatabase/serverless');
const { verifySession, hashPassword, verifyPassword } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await verifySession(req.headers.authorization);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Fetch stored password hash
    const accounts = await sql`
      SELECT id, password
      FROM neon_auth.account
      WHERE "userId" = ${session.userId}
        AND "providerId" = 'credential'
      LIMIT 1
    `;

    if (accounts.length === 0 || !accounts[0].password) {
      return res.status(400).json({ error: 'No credential account found' });
    }

    // Verify current password
    if (!verifyPassword(currentPassword, accounts[0].password)) {
      return res.status(403).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const newHash = hashPassword(newPassword);
    const now = new Date().toISOString();

    await sql`
      UPDATE neon_auth.account
      SET password = ${newHash}, "updatedAt" = ${now}
      WHERE id = ${accounts[0].id}
    `;

    // Clear the must-change-password flag
    await sql`
      DELETE FROM public.user_flags
      WHERE user_id = ${session.userId}
    `;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Failed to change password' });
  }
};
