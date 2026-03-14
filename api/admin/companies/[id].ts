import { randomBytes } from 'crypto';
import { withAdmin } from '../../_lib/auth';

/**
 * GET    /api/admin/companies/:id — list members, invitations, settings, agents
 * POST   /api/admin/companies/:id — create an invitation for a company
 * PATCH  /api/admin/companies/:id — update company settings + agents
 * DELETE /api/admin/companies/:id — revoke a pending invitation
 */
export default withAdmin(async (req, res, session, sql) => {
  const orgId = req.query.id as string;
  if (!orgId) return res.status(400).json({ error: 'Missing company id' });

  if (req.method === 'GET') {
    // List members
    const members = await sql`
      SELECT u.id, u.name, u.email, u.image, m.role, m."createdAt"
      FROM neon_auth.member m
      JOIN neon_auth.user u ON u.id = m."userId"
      WHERE m."organizationId" = ${orgId}
        AND m."userId" != ${session.userId}
      ORDER BY m."createdAt"
    `;

    // List pending invitations
    const invitations = await sql`
      SELECT id, code, email, created_at, used_at
      FROM public.platform_invitations
      WHERE organization_id = ${orgId}
      ORDER BY created_at DESC
    `;

    // Company settings
    const settingsRows = await sql`
      SELECT agency_name, tagline, logo_url, address, telephone, fax, website,
             accent_color, text_color, title_font, body_font, template_id
      FROM public.company_settings
      WHERE organization_id = ${orgId}
      LIMIT 1
    `;

    // Company agents
    const agents = await sql`
      SELECT id, name, email, sort_order
      FROM public.company_agents
      WHERE organization_id = ${orgId}
      ORDER BY sort_order
    `;

    return res.status(200).json({
      members,
      invitations,
      settings: settingsRows[0] ?? null,
      agents,
    });
  }

  if (req.method === 'POST') {
    // Create invitation
    const { email, name } = req.body ?? {};
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already a member of this org
    const existingMembers = await sql`
      SELECT u.id FROM neon_auth.user u
      JOIN neon_auth.member m ON m."userId" = u.id
      WHERE m."organizationId" = ${orgId}
        AND LOWER(u.email) = ${normalizedEmail}
      LIMIT 1
    `;
    if (existingMembers.length > 0) {
      return res.status(409).json({ error: 'This person is already a member' });
    }

    // Check if there's already a pending invite for this email
    const existingInvites = await sql`
      SELECT id FROM public.platform_invitations
      WHERE organization_id = ${orgId}
        AND LOWER(email) = ${normalizedEmail}
        AND used_at IS NULL
      LIMIT 1
    `;
    if (existingInvites.length > 0) {
      return res.status(409).json({ error: 'An invite has already been sent to this email' });
    }

    const code = randomBytes(16).toString('hex');

    const [invite] = await sql`
      INSERT INTO public.platform_invitations (code, organization_id, email, name, created_by)
      VALUES (${code}, ${orgId}, ${normalizedEmail}, ${name?.trim() || null}, ${session.userId})
      RETURNING id, code, email, name, created_at
    `;

    return res.status(201).json(invite);
  }

  if (req.method === 'DELETE') {
    // Revoke a pending invitation
    const { invitationId } = req.body ?? {};
    if (!invitationId) {
      return res.status(400).json({ error: 'invitationId is required' });
    }

    await sql`
      DELETE FROM public.platform_invitations
      WHERE id = ${invitationId}
        AND organization_id = ${orgId}
        AND used_at IS NULL
    `;

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PATCH') {
    // Update company settings + agents
    const { settings, agents } = req.body ?? {};

    if (settings) {
      const s = settings;
      const now = new Date().toISOString();

      // Upsert company_settings (unique on organization_id)
      await sql`
        INSERT INTO public.company_settings (organization_id, agency_name, tagline, logo_url, address, telephone, fax, website, accent_color, text_color, title_font, body_font, updated_at)
        VALUES (${orgId}, ${s.agency_name ?? ''}, ${s.tagline ?? ''}, ${s.logo_url ?? ''}, ${s.address ?? ''}, ${s.telephone ?? ''}, ${s.fax ?? ''}, ${s.website ?? ''}, ${s.accent_color ?? '#f3b229'}, ${s.text_color ?? '#1a1a1a'}, ${s.title_font ?? 'Playfair Display'}, ${s.body_font ?? 'Montserrat'}, ${now})
        ON CONFLICT (organization_id) DO UPDATE SET
          agency_name = EXCLUDED.agency_name,
          tagline = EXCLUDED.tagline,
          logo_url = EXCLUDED.logo_url,
          address = EXCLUDED.address,
          telephone = EXCLUDED.telephone,
          fax = EXCLUDED.fax,
          website = EXCLUDED.website,
          accent_color = EXCLUDED.accent_color,
          text_color = EXCLUDED.text_color,
          title_font = EXCLUDED.title_font,
          body_font = EXCLUDED.body_font,
          updated_at = EXCLUDED.updated_at
      `;

      // Sync org display name
      if (s.agency_name?.trim()) {
        await sql`
          UPDATE neon_auth.organization SET name = ${s.agency_name.trim()} WHERE id = ${orgId}
        `.catch(() => {});
      }
    }

    if (agents !== undefined) {
      // Replace all agents
      await sql`DELETE FROM public.company_agents WHERE organization_id = ${orgId}`;
      if (Array.isArray(agents) && agents.length > 0) {
        for (let i = 0; i < agents.length; i++) {
          const a = agents[i];
          await sql`
            INSERT INTO public.company_agents (organization_id, name, email, sort_order)
            VALUES (${orgId}, ${a.name ?? ''}, ${a.email ?? ''}, ${i})
          `;
        }
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
