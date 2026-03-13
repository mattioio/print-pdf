const { neon } = require('@neondatabase/serverless');
const { verifySession } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await verifySession(req.headers.authorization);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sql = neon(process.env.DATABASE_URL);

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
    return res.status(500).json({ error: 'Failed to load flags' });
  }
};
