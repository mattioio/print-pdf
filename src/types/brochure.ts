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
  headline: string;
  locationName: string;
  propertyAddress: string;
  locationDescription: string;
  rent: string;
  premisesLicence: string;
  accommodationDescription: string;
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
  accentColor: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  component: React.FC<{ data: BrochureData }>;
}
