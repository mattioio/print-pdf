const { put } = require('@vercel/blob');
const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  const token = authHeader.slice(7);
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

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session' });
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
