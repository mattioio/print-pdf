import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    node: process.version,
    ts: true,
    hasDbUrl: !!process.env.DATABASE_URL,
    hasAdminEmails: !!process.env.ADMIN_EMAILS,
  });
}
