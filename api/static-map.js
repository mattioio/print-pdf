/**
 * Proxy for Google Maps Static API.
 * Keeps the API key server-side (never exposed to the browser).
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

module.exports = async function handler(req, res) {
  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY not configured' });
  }

  const { lat, lng, zoom = '16', width = '800', height = '400' } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  // Hide POIs and transit for a clean property brochure map
  const styles = [
    'feature:poi|visibility:off',
    'feature:transit|visibility:off',
    'feature:road.local|element:labels|visibility:simplified',
  ].map(s => `&style=${encodeURIComponent(s)}`).join('');

  const url =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&scale=2` +
    `&markers=icon:https://maps.google.com/mapfiles/ms/icons/red-dot.png%7C${lat},${lng}` +
    styles +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).send(text);
    }

    const buffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    res.status(502).json({ error: 'Map fetch failed', detail: err.message });
  }
};
