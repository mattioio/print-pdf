const { neon } = require('@neondatabase/serverless');
const { scryptSync, randomBytes, timingSafeEqual } = require('crypto');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function verifySession(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const sql = neon(process.env.DATABASE_URL);

  const rows = await sql`
    SELECT s."userId", u.email, m."organizationId"
    FROM neon_auth.session s
    JOIN neon_auth.user u ON u.id = s."userId"
    LEFT JOIN neon_auth.member m ON m."userId" = s."userId"
    WHERE s.token = ${token}
      AND s."expiresAt" > now()
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return {
    userId: rows[0].userId,
    email: rows[0].email,
    organizationId: rows[0].organizationId ?? null,
  };
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Scrypt config — must match Better Auth's parameters exactly.
 * See: node_modules/better-auth/dist/crypto/password.mjs
 */
const SCRYPT_OPTS = { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 };

/**
 * Hash a password using scrypt (matches Better Auth's format).
 * Returns "salt:hash" where salt is 32 hex chars and hash is 128 hex chars.
 */
function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const normalized = password.normalize('NFKC');
  const hash = scryptSync(normalized, salt, 64, SCRYPT_OPTS).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(':');
  const normalized = password.normalize('NFKC');
  const derived = scryptSync(normalized, salt, 64, SCRYPT_OPTS);
  const storedBuf = Buffer.from(storedHash, 'hex');
  return timingSafeEqual(derived, storedBuf);
}

module.exports = { verifySession, isAdminEmail, hashPassword, verifyPassword };
