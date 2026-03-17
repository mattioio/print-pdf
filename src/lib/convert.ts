/**
 * Conversion between client-side BrochureData (camelCase) and
 * database rows (snake_case). Also handles mapping agency settings.
 */
import type { BrochureData, AgencyDetails, GalleryImage, AccommodationRow, ContactPerson } from '../types/brochure';
import type { BrochureRow, CompanySettingsRow, CompanyAgentRow } from './api';

/* ------------------------------------------------------------------ */
/*  Brochure: DB row → client BrochureData                           */
/* ------------------------------------------------------------------ */

export function rowToBrochure(
  row: BrochureRow,
  settings: CompanySettingsRow | null,
  _agents: CompanyAgentRow[],
): BrochureData {
  // Build agency details from company settings
  const agency: AgencyDetails = {
    name: settings?.agency_name ?? '',
    tagline: settings?.tagline ?? '',
    logoUrl: settings?.logo_url ?? '',
    address: settings?.address ?? '',
    telephone: settings?.telephone ?? '',
    fax: settings?.fax ?? '',
    website: settings?.website ?? '',
  };

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    templateId: row.template_id,

    // Fonts & colours — per-brochure overrides, falling back to company settings
    titleFont: row.title_font ?? settings?.title_font ?? 'Playfair Display',
    bodyFont: row.body_font ?? settings?.body_font ?? 'Montserrat',
    accentColor: row.accent_color ?? settings?.accent_color ?? '#f3b229',
    textColor: row.text_color ?? settings?.text_color ?? '#1a1a1a',

    agency,

    // Hero image
    heroImageUrl: row.hero_image_url,
    heroImagePosition: row.hero_image_position as { x: number; y: number },
    heroSize: row.hero_size as 'landscape' | 'tall' | 'small',
    heroZoom: row.hero_zoom,

    // Gallery
    showGallery: row.show_gallery,
    galleryImages: (row.gallery_images ?? []) as GalleryImage[],

    // Property details
    headline: row.headline,
    locationName: row.location_name,
    propertyAddress: row.property_address,
    locationDescription: row.location_description,
    rent: row.rent,
    premisesLicence: row.premises_licence,

    // Accommodation
    accommodationDescription: row.accommodation_description,
    accommodationExtra: row.accommodation_extra,
    accommodation: (row.accommodation ?? []) as AccommodationRow[],

    // Use class
    useClasses: (row.use_classes ?? []) as string[],
    useAlternatives: row.use_alternatives,
    useDescription: row.use_description,

    // Legal
    lease: row.lease,
    rates: row.rates,
    legalCosts: row.legal_costs,

    // Viewings
    viewings: (row.viewings ?? []) as ContactPerson[],
    viewingsBlurb: row.viewings_blurb,
    epc: row.epc,

    // Map
    mapUrl: row.map_url,
    mapImageUrl: row.map_image_url,

    // Disclaimer
    disclaimer: row.disclaimer,
  };
}

/* ------------------------------------------------------------------ */
/*  Brochure: client BrochureData → DB row (partial, for save)        */
/* ------------------------------------------------------------------ */

export function brochureToRow(
  data: BrochureData,
  organizationId: string,
): Partial<BrochureRow> {
  return {
    id: data.id,
    organization_id: organizationId,
    name: data.name,
    template_id: data.templateId,
    headline: data.headline,
    location_name: data.locationName,
    property_address: data.propertyAddress,
    location_description: data.locationDescription,
    rent: data.rent,
    premises_licence: data.premisesLicence,
    accommodation_description: data.accommodationDescription,
    accommodation_extra: data.accommodationExtra,
    accommodation: data.accommodation as unknown as unknown[],
    use_classes: data.useClasses,
    use_alternatives: data.useAlternatives,
    use_description: data.useDescription,
    lease: data.lease,
    rates: data.rates,
    legal_costs: data.legalCosts,
    viewings: data.viewings as unknown as unknown[],
    viewings_blurb: data.viewingsBlurb,
    epc: data.epc,
    map_url: data.mapUrl,
    disclaimer: data.disclaimer,
    hero_image_url: data.heroImageUrl,
    hero_image_position: data.heroImagePosition,
    hero_size: data.heroSize,
    hero_zoom: data.heroZoom,
    show_gallery: data.showGallery,
    gallery_images: data.galleryImages as unknown as unknown[],
    map_image_url: data.mapImageUrl,
    // Per-brochure overrides are null by default (use company settings)
    accent_color: null,
    text_color: null,
    title_font: null,
    body_font: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Company settings: DB → client AgencySettings shape                */
/* ------------------------------------------------------------------ */

export interface ClientCompanySettings {
  agency: AgencyDetails;
  accentColor: string;
  textColor: string;
  titleFont: string;
  bodyFont: string;
  templateId: string;
  agents: ContactPerson[];
}

export function settingsToClient(
  row: CompanySettingsRow | null,
  agents: CompanyAgentRow[],
): ClientCompanySettings {
  return {
    agency: {
      name: row?.agency_name ?? '',
      tagline: row?.tagline ?? '',
      logoUrl: row?.logo_url ?? '',
      address: row?.address ?? '',
      telephone: row?.telephone ?? '',
      fax: row?.fax ?? '',
      website: row?.website ?? '',
    },
    accentColor: row?.accent_color ?? '#f3b229',
    textColor: row?.text_color ?? '#1a1a1a',
    titleFont: row?.title_font ?? 'Playfair Display',
    bodyFont: row?.body_font ?? 'Montserrat',
    templateId: row?.template_id ?? 'classic',
    agents: agents.map((a) => ({ name: a.name, email: a.email })),
  };
}

export function clientToSettingsRow(
  settings: ClientCompanySettings,
): Partial<CompanySettingsRow> {
  return {
    agency_name: settings.agency.name,
    tagline: settings.agency.tagline,
    logo_url: settings.agency.logoUrl,
    address: settings.agency.address,
    telephone: settings.agency.telephone,
    fax: settings.agency.fax,
    website: settings.agency.website,
    accent_color: settings.accentColor,
    text_color: settings.textColor,
    title_font: settings.titleFont,
    body_font: settings.bodyFont,
  };
}
