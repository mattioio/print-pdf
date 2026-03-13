export interface AgencyDetails {
  name: string;
  tagline: string;
  logoUrl: string;
  address: string;
  telephone: string;
  fax: string;
  website: string;
}

export interface AccommodationRow {
  id: string;
  floor: string;
  sqFt: number | null;
  sqM: number | null;
}

export interface GalleryImage {
  id: string;
  url: string;
  position: { x: number; y: number };
}

export interface ContactPerson {
  name: string;
  email: string;
}

export interface BrochureData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  templateId: string;
  titleFont: string;
  bodyFont: string;
  agency: AgencyDetails;
  heroImageUrl: string;
  heroImagePosition: { x: number; y: number };
  heroSize: 'landscape' | 'tall';
  heroZoom: number;
  showGallery: boolean;
  galleryImages: GalleryImage[];
  headline: string;
  locationName: string;
  propertyAddress: string;
  locationDescription: string;
  rent: string;
  premisesLicence: string;
  accommodationDescription: string;
  accommodationExtra: string;
  accommodation: AccommodationRow[];
  useClasses: string[];
  useAlternatives: boolean;
  useDescription: string;
  lease: string;
  rates: string;
  legalCosts: string;
  viewings: ContactPerson[];
  viewingsBlurb: string;
  epc: string;
  mapUrl: string;
  mapImageUrl: string;
  disclaimer: string;
  accentColor: string;
  textColor: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  pdfComponent: React.FC<{ data: BrochureData }>;
  formComponent: React.FC;
  defaultData: Partial<BrochureData>;
}
