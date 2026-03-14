import { v4 as uuid } from 'uuid';
import type { BrochureData } from '../types/brochure';
import type { ClientCompanySettings } from '../lib/convert';
import { templates } from '../components/pdf/templates';

// Keep old localStorage-based default for migration
export { createDefaultBrochure } from './defaultsLegacy';

/**
 * Create a default brochure using company settings from the API.
 * Template-specific defaults (headline, disclaimer, etc.) come from the template registry.
 */
export function createDefaultBrochureForOrg(
  settings: ClientCompanySettings,
  templateId: string = 'classic',
): BrochureData {
  const template = templates[templateId] ?? templates.classic;
  const now = new Date().toISOString();
  return {
    // Base fields
    id: uuid(),
    name: 'New Document',
    createdAt: now,
    updatedAt: now,
    templateId: template.id,
    titleFont: settings.titleFont,
    bodyFont: settings.bodyFont,
    agency: { ...settings.agency },
    heroImageUrl: '',
    heroImagePosition: { x: 50, y: 50 },
    heroSize: 'landscape',
    heroZoom: 100,
    showGallery: false,
    galleryImages: [],
    headline: '',
    locationName: '',
    propertyAddress: '',
    locationDescription: '',
    rent: '',
    premisesLicence: '',
    accommodationDescription: '',
    accommodationExtra: '',
    accommodation: [
      { id: uuid(), floor: 'Ground Floor', sqFt: null, sqM: null },
    ],
    useClasses: [],
    useAlternatives: false,
    useDescription: '',
    lease: '',
    rates: '',
    legalCosts: '',
    viewings: [],
    viewingsBlurb: '',
    epc: '',
    mapUrl: '',
    mapImageUrl: '',
    disclaimer: '',
    accentColor: settings.accentColor,
    textColor: settings.textColor,
    // Template-specific defaults override the blanks above
    ...template.defaultData,
  };
}
