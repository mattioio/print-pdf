import type { BrochureData } from '../types/brochure';
import { saveImage, loadImage, deleteImagesByPrefix, copyImages, IMAGE_FIELDS } from './imageStore';
import type { ImageField } from './imageStore';

const STORAGE_KEY = 'print-pdf-brochures';

function deriveName(d: BrochureData): string {
  const parts = [d.locationName, d.headline].filter(Boolean);
  return parts.join(': ') || 'Untitled';
}

/** Strip image fields out of a brochure before writing to localStorage. */
function stripImages(b: BrochureData): BrochureData {
  const stripped = { ...b };
  for (const field of IMAGE_FIELDS) {
    stripped[field] = '';
  }
  // Strip gallery image URLs (keep metadata like position)
  if (stripped.galleryImages?.length) {
    stripped.galleryImages = stripped.galleryImages.map((img) => ({ ...img, url: '' }));
  }
  return stripped;
}

// ── Synchronous reads (text-only, fast) ───────────────────────

export function listBrochures(): BrochureData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const brochures: BrochureData[] = JSON.parse(raw);
    return brochures
      .map((b) => ({ ...b, name: deriveName(b) }))
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  } catch {
    return [];
  }
}

/** Load brochure metadata (no images — use loadBrochureWithImages for full data). */
export function loadBrochure(id: string): BrochureData | null {
  const brochures = listBrochures();
  const b = brochures.find((b) => b.id === id) ?? null;
  if (!b) return null;
  return {
    ...b,
    titleFont: b.titleFont || 'Playfair Display',
    bodyFont: b.bodyFont || 'Montserrat',
    viewingsBlurb: b.viewingsBlurb ?? '',
    mapUrl: b.mapUrl ?? '',
    heroSize: b.heroSize ?? 'landscape',
    heroZoom: b.heroZoom ?? 100,
    showGallery: b.showGallery ?? false,
    galleryImages: b.galleryImages ?? [],
    accommodationExtra: b.accommodationExtra ?? '',
    disclaimer: b.disclaimer ?? '*Misrepresentation Act:* Whilst every care is taken in the preparation of these particulars, the agents, any joint agents involved, and the vendor take no responsibility for any error, misstatement or omission in these details. Measurements are approximate and for guidance only. These particulars do not constitute an offer or contract and members of the Agents firm have no authority to make any representation or warranty in relation to the property.',
  };
}

// ── Async operations (touch IndexedDB) ────────────────────────

/** Load a brochure with its images hydrated from IndexedDB. */
export async function loadBrochureWithImages(id: string): Promise<BrochureData | null> {
  const b = loadBrochure(id);
  if (!b) return null;

  // Hydrate images from IndexedDB
  await Promise.all(
    IMAGE_FIELDS.map(async (field: ImageField) => {
      const data = await loadImage(`${id}:${field}`);
      if (data) b[field] = data;
    }),
  );

  // Hydrate gallery images
  if (b.galleryImages?.length) {
    await Promise.all(
      b.galleryImages.map(async (img) => {
        const data = await loadImage(`${id}:gallery:${img.id}`);
        if (data) img.url = data;
      }),
    );
  }

  return b;
}

/** Save brochure: text to localStorage, images to IndexedDB. */
export async function saveBrochureAsync(brochure: BrochureData): Promise<void> {
  // Save images to IndexedDB
  await Promise.all(
    IMAGE_FIELDS.map(async (field: ImageField) => {
      const value = brochure[field];
      if (value) {
        await saveImage(`${brochure.id}:${field}`, value);
      }
    }),
  );

  // Save gallery images to IndexedDB
  if (brochure.galleryImages?.length) {
    await Promise.all(
      brochure.galleryImages.map(async (img) => {
        if (img.url) {
          await saveImage(`${brochure.id}:gallery:${img.id}`, img.url);
        }
      }),
    );
  }

  // Save text-only data to localStorage
  const brochures = listBrochures();
  const index = brochures.findIndex((b) => b.id === brochure.id);
  const updated = stripImages({ ...brochure, updatedAt: new Date().toISOString() });
  if (index >= 0) {
    brochures[index] = updated;
  } else {
    brochures.push(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brochures));
}

/**
 * Synchronous save for backwards compat (strips images, saves text only).
 * Images must be saved separately via saveBrochureAsync or on first load migration.
 */
export function saveBrochure(brochure: BrochureData): void {
  // Fire-and-forget async image save
  saveBrochureAsync(brochure).catch(() => {});
}

export async function duplicateBrochure(id: string): Promise<string | null> {
  const source = await loadBrochureWithImages(id);
  if (!source) return null;
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const copy: BrochureData = {
    ...source,
    id: newId,
    name: `${source.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await saveBrochureAsync(copy);
  // Also copy images in IndexedDB
  await copyImages(id, newId);
  return newId;
}

export async function deleteBrochure(id: string): Promise<void> {
  const brochures = listBrochures().filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brochures));
  await deleteImagesByPrefix(id);
}

// ── Migration: move inline images from localStorage to IndexedDB ──

export async function migrateImagesToIndexedDB(): Promise<void> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const brochures: BrochureData[] = JSON.parse(raw);
    let needsWrite = false;

    for (const b of brochures) {
      for (const field of IMAGE_FIELDS) {
        const value = b[field];
        if (value && value.startsWith('data:')) {
          // Move to IndexedDB
          await saveImage(`${b.id}:${field}`, value);
          b[field] = '';
          needsWrite = true;
        }
      }
    }

    if (needsWrite) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(brochures));
      console.log('[storage] Migrated inline images to IndexedDB');
    }
  } catch (e) {
    console.warn('[storage] Image migration failed:', e);
  }
}
