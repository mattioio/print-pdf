import { StyleSheet } from '@react-pdf/renderer';

/**
 * Shared styles used across both Classic Page 1 and Page 2.
 * Single source of truth — change once, applies everywhere.
 */
export const shared = StyleSheet.create({
  // ── Layout ──
  topBar: {
    height: 5,
  },
  col: {
    flex: 1,
  },

  // ── Section labels ──
  sectionLabel: {
    fontWeight: 700,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  sectionLabelSpaced: {
    fontWeight: 700,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    color: '#1a1a1a',
  },

  // ── Body text ──
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.75,
    color: '#555',
  },

  // ── Contact cards ──
  contactItem: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
  },
  contactName: {
    fontWeight: 700,
    fontSize: 8,
    color: '#1a1a1a',
  },
  contactEmail: {
    fontSize: 8.5,
    color: '#888',
    marginTop: 2,
  },
  viewingsBlurb: {
    fontSize: 8.5,
    lineHeight: 1.75,
    color: '#555',
    marginTop: 12,
  },

  // ── Map ──
  mapSection: {
    paddingHorizontal: 40,
    marginTop: 28,
    flex: 1,
  },
  mapLabel: {
    fontWeight: 700,
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  mapImage: {
    width: '100%',
    height: 270,
    objectFit: 'cover',
  },
  mapPlaceholder: {
    width: '100%',
    height: 270,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Page 2 header ──
  p2header: {
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  p2logo: {
    width: 100,
    height: 20,
    objectFit: 'contain',
  },
  p2logoPlaceholder: {
    width: 80,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  // ── Footer ──
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  disclaimer: {
    fontSize: 6.5,
    color: '#666',
    lineHeight: 1.5,
  },
});
