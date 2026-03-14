/**
 * Legacy default brochure factory using localStorage agency settings.
 * Kept for migration purposes — new code should use createDefaultBrochureForOrg.
 */
import { v4 as uuid } from 'uuid';
import type { BrochureData } from '../types/brochure';
import { loadAgencySettings } from './agency';

export function createDefaultBrochure(): BrochureData {
  const now = new Date().toISOString();
  const settings = loadAgencySettings();
  return {
    id: uuid(),
    name: 'New Document',
    createdAt: now,
    updatedAt: now,
    templateId: 'classic',
    titleFont: settings.titleFont,
    bodyFont: settings.bodyFont,
    agency: { ...settings.agency },
    heroImageUrl: '',
    heroImagePosition: { x: 50, y: 50 },
    heroSize: 'landscape',
    heroZoom: 100,
    showGallery: false,
    galleryImages: [],
    headline: 'COMMERCIAL PROPERTY TO LET',
    locationName: '',
    propertyAddress: '',
    locationDescription: '',
    rent: 'Upon Application.',
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
    rates: 'Interested parties are advised to make their own enquiries directly with the Local Authority.',
    legalCosts: 'Each party to bear their own legal costs.',
    viewings: [],
    viewingsBlurb: '',
    epc: '',
    mapUrl: '',
    mapImageUrl: '',
    disclaimer: '*Misrepresentation Act:* Whilst every care is taken in the preparation of these particulars, the agents, any joint agents involved, and the vendor take no responsibility for any error, misstatement or omission in these details. Measurements are approximate and for guidance only. These particulars do not constitute an offer or contract and members of the Agents firm have no authority to make any representation or warranty in relation to the property.',
    accentColor: settings.accentColor,
    textColor: settings.textColor,
  };
}
