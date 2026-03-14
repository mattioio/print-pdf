import { withAdmin } from '../../_lib/auth';

/**
 * DELETE /api/admin/users/:id — remove a member from their organization
 */
export default withAdmin(async (req, res, _session, sql) => {
  const userId = req.query.id as string;
  if (!userId) return res.status(400).json({ error: 'Missing user id' });

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
});
