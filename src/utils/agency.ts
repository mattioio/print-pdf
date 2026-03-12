import type { AgencyDetails, ContactPerson } from '../types/brochure';

const STORAGE_KEY = 'print-pdf-agency';

export interface AgencySettings {
  agency: AgencyDetails;
  accentColor: string;
  titleFont: string;
  bodyFont: string;
  agents: ContactPerson[];
}

export const defaultAgencySettings: AgencySettings = {
  agency: {
    name: 'Jenkins | Law',
    tagline: 'Commercial Property Solutions',
    logoUrl: '',
    address: '20 Hanover Street\nMayfair\nLondon W1S 1YR',
    telephone: '+44 (0)20 7440 1840',
    fax: '+44 (0)20 3478 0363',
    website: 'www.jenkinslaw.co.uk',
  },
  accentColor: '#f3b229',
  titleFont: 'Playfair Display',
  bodyFont: 'Montserrat',
  agents: [
    { name: 'Ryan Mylroie', email: 'ryan@jenkinslaw.co.uk' },
    { name: 'Paul Jenkins', email: 'paul@jenkinslaw.co.uk' },
    { name: 'Kyle McGuire', email: 'kyle@jenkinslaw.co.uk' },
  ],
};

export function loadAgencySettings(): AgencySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAgencySettings;
    const parsed = JSON.parse(raw);
    // Backfill new fields for existing settings
    return {
      ...defaultAgencySettings,
      ...parsed,
      agency: { ...defaultAgencySettings.agency, ...parsed.agency },
    };
  } catch {
    return defaultAgencySettings;
  }
}

export function saveAgencySettings(settings: AgencySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
