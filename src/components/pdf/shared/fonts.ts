import { Font } from '@react-pdf/renderer';

// Use absolute URLs so fonts resolve correctly in all contexts
const base = typeof window !== 'undefined' ? window.location.origin : '';

export const FONT_OPTIONS = [
  { id: 'Montserrat', label: 'Montserrat', category: 'sans-serif' },
  { id: 'Inter', label: 'Inter', category: 'sans-serif' },
  { id: 'Poppins', label: 'Poppins', category: 'sans-serif' },
  { id: 'Raleway', label: 'Raleway', category: 'sans-serif' },
  { id: 'DM Sans', label: 'DM Sans', category: 'sans-serif' },
  { id: 'Playfair Display', label: 'Playfair Display', category: 'serif' },
  { id: 'Lora', label: 'Lora', category: 'serif' },
  { id: 'EB Garamond', label: 'EB Garamond', category: 'serif' },
  { id: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif' },
  { id: 'Libre Baskerville', label: 'Libre Baskerville', category: 'serif' },
] as const;

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: `${base}/fonts/montserrat-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/montserrat-semibold.ttf`, fontWeight: 600 },
    { src: `${base}/fonts/montserrat-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Playfair Display',
  fonts: [
    { src: `${base}/fonts/playfair-display-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/playfair-display-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: `${base}/fonts/inter-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/inter-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Lora',
  fonts: [
    { src: `${base}/fonts/lora-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/lora-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Raleway',
  fonts: [
    { src: `${base}/fonts/raleway-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/raleway-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'EB Garamond',
  fonts: [
    { src: `${base}/fonts/eb-garamond-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/eb-garamond-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Poppins',
  fonts: [
    { src: `${base}/fonts/poppins-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/poppins-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Cormorant Garamond',
  fonts: [
    { src: `${base}/fonts/cormorant-garamond-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/cormorant-garamond-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'DM Sans',
  fonts: [
    { src: `${base}/fonts/dm-sans-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/dm-sans-bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: 'Libre Baskerville',
  fonts: [
    { src: `${base}/fonts/libre-baskerville-regular.ttf`, fontWeight: 400 },
    { src: `${base}/fonts/libre-baskerville-bold.ttf`, fontWeight: 700 },
  ],
});

// Disable hyphenation for cleaner text
Font.registerHyphenationCallback((word: string) => [word]);
