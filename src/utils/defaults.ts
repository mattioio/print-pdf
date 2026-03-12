import { v4 as uuid } from 'uuid';
import type { BrochureData } from '../types/brochure';
import { loadAgencySettings } from './agency';

export function createDefaultBrochure(): BrochureData {
  const now = new Date().toISOString();
  const settings = loadAgencySettings();
  return {
    id: uuid(),
    name: 'New Brochure',
    createdAt: now,
    updatedAt: now,
    templateId: 'classic',
    titleFont: settings.titleFont,
    bodyFont: settings.bodyFont,
    agency: { ...settings.agency },
    heroImageUrl: '',
    heroImagePosition: { x: 50, y: 50 },
    headline: 'COMMERCIAL PROPERTY TO LET',
    locationName: '',
    propertyAddress: '',
    locationDescription: '',
    rent: 'Upon Application.',
    premisesLicence: '',
    accommodationDescription: '',
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
    accentColor: settings.accentColor,
  };
}
