/**
 * Auth proxy — forwards Better Auth requests to Neon Auth.
 *
 * Why: Neon Auth lives on a different domain. Better Auth sets
 * SameSite=Lax cookies, which Safari/iPad refuses to store for
 * cross-origin requests. By proxying through our own domain, cookies
 * are same-origin and work everywhere.
 */

const NEON_AUTH_URL = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  if (!NEON_AUTH_URL) {
    return res.status(500).json({ error: 'NEON_AUTH_URL not configured' });
  }

  const pathSegments = req.query.path || [];
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
  const targetUrl = `${NEON_AUTH_URL}/${subPath}`;

  // Only forward safe headers — clean server-to-server request
  const forwardHeaders = {
    'content-type': req.headers['content-type'] || 'application/json',
    'accept': req.headers['accept'] || 'application/json',
  };

  // Forward cookies (session token from the client)
  if (req.headers.cookie) {
    forwardHeaders['cookie'] = req.headers.cookie;
  }

  // Forward authorization if present
  if (req.headers['authorization']) {
    forwardHeaders['authorization'] = req.headers['authorization'];
  }

  try {
    const fetchOpts = {
      method: req.method,
      headers: forwardHeaders,
      redirect: 'manual',
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, fetchOpts);

    // Forward Content-Type
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);

    // Handle Set-Cookie: rewrite to work on our domain
    const setCookies = upstream.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      const rewritten = setCookies.map(rewriteCookie);
      res.setHeader('set-cookie', rewritten);
    }

    const body = await upstream.text();
    res.status(upstream.status).send(body);
  } catch (err) {
    console.error('Auth proxy error:', err.message);
    res.status(502).json({ error: 'Auth proxy failed', detail: err.message });
  }
};

/**
 * Rewrite a Set-Cookie string:
 *  - Remove Domain (defaults to our domain)
 *  - Set Path=/
 *  - Ensure Secure + SameSite=Lax
 */
function rewriteCookie(cookie) {
  let result = cookie.replace(/;\s*domain=[^;]*/gi, '');
  result = result.replace(/;\s*path=[^;]*/gi, '');
  result += '; Path=/';
  if (!/;\s*secure/i.test(result)) {
    result += '; Secure';
  }
  result = result.replace(/;\s*samesite=[^;]*/gi, '');
  result += '; SameSite=Lax';
  return result;
}
