const { put } = require('@vercel/blob');
const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract session token from cookie or Bearer header
  const cookies = (req.headers.cookie || '').split(';').reduce((acc, c) => {
    const [k, ...v] = c.trim().split('=');
    if (k) acc[k] = v.join('=');
    return acc;
  }, {});
  const sessionToken = cookies['better-auth.session_token']?.split('.')[0]
    || cookies['__Secure-better-auth.session_token']?.split('.')[0];

  // Also accept Bearer token (raw session token, not JWT)
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = sessionToken || bearerToken;
  console.log('[upload] cookie keys:', Object.keys(cookies));
  console.log('[upload] sessionToken:', sessionToken ? `${sessionToken.slice(0, 8)}...` : null);
  console.log('[upload] bearerToken:', bearerToken ? `${bearerToken.slice(0, 8)}...` : null);
  console.log('[upload] final token:', token ? `${token.slice(0, 8)}...` : null);
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const sessions = await sql`
      SELECT s."userId", m."organizationId"
      FROM neon_auth.session s
      LEFT JOIN neon_auth.member m ON m."userId" = s."userId"
      WHERE s.token = ${token}
        AND s."expiresAt" > now()
      LIMIT 1
    `;

    console.log('[upload] session rows:', sessions.length);
    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session', debug: { hasCookie: !!sessionToken, hasBearer: !!bearerToken, tokenPrefix: token?.slice(0, 8) } });
    }

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ error: 'Missing multipart boundary' });
    }

    const { fileBuffer, filename, mimeType } = parseMultipart(body, boundary);
    if (!fileBuffer) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const blob = await put(filename || 'image.jpg', fileBuffer, {
      access: 'public',
      contentType: mimeType || 'image/jpeg',
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

function parseMultipart(body, boundary) {
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = body.indexOf(boundaryBuf);

  while (start !== -1) {
    const nextStart = body.indexOf(boundaryBuf, start + boundaryBuf.length);
    if (nextStart === -1) break;
    parts.push(body.subarray(start + boundaryBuf.length, nextStart));
    start = nextStart;
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headers = part.subarray(0, headerEnd).toString();
    if (!headers.includes('filename=')) continue;

    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const contentTypeMatch = headers.match(/Content-Type:\s*(\S+)/i);

    const fileBuffer = part.subarray(headerEnd + 4, part.length - 2);
    return {
      fileBuffer,
      filename: filenameMatch?.[1] || 'upload.jpg',
      mimeType: contentTypeMatch?.[1] || 'image/jpeg',
    };
  }

  return { fileBuffer: null, filename: null, mimeType: null };
}
