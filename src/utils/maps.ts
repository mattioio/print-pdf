/**
 * Parse lat/lng coordinates from a Google Maps URL.
 *
 * Supported formats:
 *   https://www.google.com/maps/@51.4613,-0.1156,15z
 *   https://www.google.com/maps/place/.../@51.4613,-0.1156,15z/...
 *   https://www.google.com/maps/place/...!3d51.4613!4d-0.1156...
 *   https://maps.google.com/?q=51.4613,-0.1156
 *   https://www.google.com/maps?q=51.4613,-0.1156
 *   https://www.google.com/maps?ll=51.4613,-0.1156
 *   https://maps.app.goo.gl/... (short links — will attempt to resolve)
 */
export function parseCoordsFromUrl(
  url: string
): { lat: number; lng: number } | null {
  if (!url) return null;

  // Try /@lat,lng pattern (most common when you copy from address bar)
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Try !3d=lat!4d=lng pattern (Google Maps place data params)
  const dataMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (dataMatch) {
    return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };
  }

  // Try /dir/ or /data= patterns with 1d/2d params
  const dirMatch = url.match(/!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/);
  if (dirMatch) {
    return { lat: parseFloat(dirMatch[1]), lng: parseFloat(dirMatch[2]) };
  }

  // Try ?q=lat,lng pattern
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  // Try ?ll=lat,lng or &ll=lat,lng pattern (Apple Maps style)
  const llMatch = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  }

  // Try ?center=lat,lng pattern
  const centerMatch = url.match(/[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (centerMatch) {
    return { lat: parseFloat(centerMatch[1]), lng: parseFloat(centerMatch[2]) };
  }

  return null;
}

/**
 * Geocode a query string (place name or address) via Nominatim.
 * If url is provided, extracts place name from /maps/place/NAME/ pattern.
 * If directQuery is provided, geocodes that directly (e.g. a street address).
 */
export async function resolveAndParseCoords(
  url: string | null,
  directQuery?: string
): Promise<{ lat: number; lng: number } | null> {
  let query = directQuery;

  if (!query && url) {
    const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/);
    if (!placeMatch) return null;
    query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  }

  if (!query) return null;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'User-Agent': 'PrintPDF-BrochureBuilder/1.0' } }
    );
    const results = await res.json();
    if (results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
    }
  } catch {
    // geocoding failed
  }

  return null;
}

/**
 * Generate a static map image as a data URL.
 * In production, routes through /api/static-map (server-side proxy, key stays secret).
 * In dev (Vite only, no API routes), falls back to direct tile compositing.
 */
export async function generateStaticMap(
  lat: number,
  lng: number,
  opts: { width?: number; height?: number; zoom?: number } = {}
): Promise<string> {
  const { width = 800, height = 400, zoom = 16 } = opts;

  // Try the server-side proxy first (works in production + vercel dev)
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      zoom: zoom.toString(),
      width: width.toString(),
      height: height.toString(),
    });
    const res = await fetch(`/api/static-map?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // fall through to tile fallback
  }

  // Fallback: composite tiles directly (dev only, unofficial)
  return generateStaticMapFromTiles(lat, lng, { width, height, zoom });
}

async function generateStaticMapFromTiles(
  lat: number,
  lng: number,
  { width = 800, height = 400, zoom = 16 }: { width?: number; height?: number; zoom?: number }
): Promise<string> {
  const tileSize = 256;
  const n = Math.pow(2, zoom);

  const centerPxX = ((lng + 180) / 360) * n * tileSize;
  const latRad = (lat * Math.PI) / 180;
  const centerPxY =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n *
    tileSize;

  const topLeftPxX = centerPxX - width / 2;
  const topLeftPxY = centerPxY - height / 2;
  const startTileX = Math.floor(topLeftPxX / tileSize);
  const startTileY = Math.floor(topLeftPxY / tileSize);
  const endTileX = Math.floor((topLeftPxX + width) / tileSize);
  const endTileY = Math.floor((topLeftPxY + height) / tileSize);
  const offsetX = topLeftPxX - startTileX * tileSize;
  const offsetY = topLeftPxY - startTileY * tileSize;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e5e3df';
  ctx.fillRect(0, 0, width, height);

  const loadTile = (tx: number, ty: number): Promise<void> =>
    new Promise((resolve) => {
      const wrapTx = ((tx % n) + n) % n;
      if (ty < 0 || ty >= n) { resolve(); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, (tx - startTileX) * tileSize - offsetX, (ty - startTileY) * tileSize - offsetY, tileSize, tileSize);
        resolve();
      };
      img.onerror = () => resolve();
      // lyrs=r = road map without POI icons
      img.src = `https://mt0.google.com/vt/lyrs=r&x=${wrapTx}&y=${ty}&z=${zoom}`;
    });

  const promises: Promise<void>[] = [];
  for (let tx = startTileX; tx <= endTileX; tx++)
    for (let ty = startTileY; ty <= endTileY; ty++)
      promises.push(loadTile(tx, ty));
  await Promise.all(promises);

  // Pin marker — clean teardrop
  const cx = width / 2, cy = height / 2;
  const r = 14; // circle radius
  const tipY = cy + r + 10; // tip of teardrop

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  // Teardrop body
  ctx.beginPath();
  ctx.arc(cx, cy - 6, r, Math.PI * 0.2, Math.PI * 0.8, true);
  ctx.lineTo(cx, tipY);
  ctx.closePath();
  ctx.fillStyle = '#CC2200';
  ctx.fill();

  // Circle head
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, r, 0, Math.PI * 2);
  ctx.fillStyle = '#E53224';
  ctx.fill();

  // Inner white dot
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.85);
}
