import { StyleSheet } from '@react-pdf/renderer';

export const DISCLAIMER =
  'Whilst every care is taken in the preparation of these particulars, the agents, any joint agents involved, and the vendor take no responsibility for any error, misstatement or omission in these details. Measurements are approximate and for guidance only. These particulars do not constitute an offer or contract and members of the Agents firm have no authority to make any representation or warranty in relation to the property.';

export const ms = StyleSheet.create({
  /* ── Page ── */
  page: {
    fontSize: 9,
    color: '#222',
  },

  /* ── Hero image ── */
  heroImage: {
    width: '100%',
    objectFit: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    color: '#bbb',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* ── Gallery strip ── */
  galleryStrip: {
    flexDirection: 'row',
    width: '100%',
  },
  galleryImage: {
    flex: 1,
    objectFit: 'cover',
  },

  /* ── Title band ── */
  titleBand: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 16,
  },
  accentLine: {
    display: 'none',
  },
  locationName: {
    fontWeight: 700,
    fontSize: 36,
    letterSpacing: -0.5,
    lineHeight: 1.05,
    color: '#111',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  headline: {
    fontWeight: 600,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#888',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  addressText: {
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: '#aaa',
    textTransform: 'uppercase',
  },

  /* ── Two-column body ── */
  body: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingTop: 12,
    gap: 28,
  },
  bodyClip: {
    flex: 1,
    overflow: 'hidden',
  },
  col: {
    flex: 1,
  },

  /* ── Section labels ── */
  sectionLabel: {
    fontWeight: 700,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
    color: '#bbb',
  },
  sectionLabelSpaced: {
    fontWeight: 700,
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 14,
    marginBottom: 6,
    color: '#bbb',
  },

  /* ── Body text ── */
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.6,
    color: '#444',
  },

  /* ── Accommodation table ── */
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  tableFloor: {
    fontSize: 8.5,
    color: '#444',
    width: '42%',
  },
  tableSqFt: {
    fontSize: 8.5,
    color: '#222',
    fontWeight: 600,
    width: '32%',
    textAlign: 'right',
  },
  tableSqM: {
    fontSize: 7,
    color: '#aaa',
    width: '26%',
    textAlign: 'right',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingTop: 5,
    paddingBottom: 3,
    marginTop: 1,
  },

  /* ── Page 2 header ── */
  p2header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 20,
  },
  p2logo: {
    width: 120,
    height: 24,
    objectFit: 'contain',
  },
  p2logoPlaceholder: {
    width: 80,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  p2headerLine: {
    height: 2,
    marginHorizontal: 40,
    borderRadius: 1,
  },
  p2headerContact: {
    fontSize: 7,
    color: '#999',
    letterSpacing: 0.5,
  },

  /* ── Contact cards ── */
  contactItem: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
  },
  contactName: {
    fontWeight: 700,
    fontSize: 8,
    color: '#222',
  },
  contactEmail: {
    fontSize: 8,
    color: '#888',
    marginTop: 1,
  },
  viewingsBlurb: {
    fontSize: 8.5,
    lineHeight: 1.6,
    color: '#444',
    marginTop: 12,
  },

  /* ── Map ── */
  mapSection: {
    paddingHorizontal: 40,
    marginTop: 24,
    flex: 1,
  },
  mapImage: {
    width: '100%',
    height: 260,
    objectFit: 'cover',
    borderRadius: 6,
  },
  mapPlaceholder: {
    width: '100%',
    height: 260,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  mapPlaceholderText: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* ── Footer ── */
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  disclaimer: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    fontSize: 5.5,
    color: '#bbb',
    lineHeight: 1.5,
  },
  disclaimerBold: {
    fontWeight: 700,
    fontSize: 5.5,
    color: '#999',
  },

  /* ── Page 1 logo overlay ── */
  logoOverlay: {
    position: 'absolute',
    top: 16,
    left: 40,
  },
  logoOverlayImg: {
    width: 100,
    height: 20,
    objectFit: 'contain',
  },
  logoOverlayBg: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
});
