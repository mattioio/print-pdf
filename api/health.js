module.exports = function handler(_req, res) {
  res.status(200).json({
    ok: true,
    node: process.version,
    hasDbUrl: !!process.env.DATABASE_URL,
    hasAdminEmails: !!process.env.ADMIN_EMAILS,
  });
};
