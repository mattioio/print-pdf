/**
 * Auth proxy — forwards Better Auth requests to Neon Auth.
 *
 * Why: Neon Auth lives on a different domain. Better Auth sets
 * SameSite=Lax cookies, which Safari/iPad refuses to store for
 * cross-origin requests. By proxying through our own domain, cookies
 * are same-origin and work everywhere.
 *
 * The Vercel rewrite approach doesn't work because Neon Auth validates
 * the Origin header. This serverless function sets the correct headers.
 */

const NEON_AUTH_URL = process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL;

module.exports = async function handler(req, res) {
  const pathSegments = req.query.path || [];
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
  const targetUrl = `${NEON_AUTH_URL}/${subPath}`;

  // Build headers to forward (skip host-related ones)
  const forwardHeaders = {};
  const skipHeaders = new Set(['host', 'connection', 'transfer-encoding', 'content-length']);
  for (const [key, value] of Object.entries(req.headers)) {
    if (!skipHeaders.has(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  }

  // Set the correct Origin for Neon Auth validation
  const neonOrigin = new URL(NEON_AUTH_URL).origin;
  forwardHeaders['origin'] = neonOrigin;
  forwardHeaders['referer'] = neonOrigin + '/';

  // Forward cookies from the client
  if (req.headers.cookie) {
    forwardHeaders['cookie'] = req.headers.cookie;
  }

  try {
    // Build the fetch options
    const fetchOpts = {
      method: req.method,
      headers: forwardHeaders,
      redirect: 'manual',
    };

    // Forward body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!forwardHeaders['content-type']) {
        forwardHeaders['content-type'] = 'application/json';
      }
    }

    const upstream = await fetch(targetUrl, fetchOpts);

    // Copy response headers
    const responseHeaders = {};
    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();
      // Skip hop-by-hop headers
      if (['transfer-encoding', 'connection', 'keep-alive'].includes(lower)) continue;
      responseHeaders[key] = value;
    }

    // Handle Set-Cookie: rewrite to work on our domain
    const setCookies = upstream.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      const rewritten = setCookies.map(rewriteCookie);
      // Vercel requires set-cookie as array
      res.setHeader('set-cookie', rewritten);
    }

    // Remove CORS headers — the request is now same-origin
    res.removeHeader('access-control-allow-origin');
    res.removeHeader('access-control-allow-credentials');

    const body = await upstream.text();
    res.status(upstream.status).send(body);
  } catch (err) {
    console.error('Auth proxy error:', err);
    res.status(502).json({ error: 'Auth proxy error', message: err.message });
  }
};

/**
 * Rewrite a Set-Cookie string:
 *  - Remove Domain (so it defaults to our domain)
 *  - Set SameSite=Lax (safe for same-origin)
 *  - Ensure Secure flag
 *  - Set Path=/
 */
function rewriteCookie(cookie) {
  // Remove domain attribute
  let result = cookie.replace(/;\s*domain=[^;]*/gi, '');
  // Ensure path is /
  result = result.replace(/;\s*path=[^;]*/gi, '');
  result += '; Path=/';
  // Ensure secure
  if (!/;\s*secure/i.test(result)) {
    result += '; Secure';
  }
  // Ensure SameSite=Lax (same-origin now, so Lax is fine)
  result = result.replace(/;\s*samesite=[^;]*/gi, '');
  result += '; SameSite=Lax';
  return result;
}
