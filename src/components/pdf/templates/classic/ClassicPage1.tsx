import { Page, View, Text, Image, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer';
import type { BrochureData } from '../../../../types/brochure';
import RichText from '../../shared/RichText';
import { buildContentStream, allocateColumns, getTableDensity, HERO_HEIGHTS, BASE_BODY_HEIGHT } from '../../shared/columnFlow';
import type { MeasuredBlock } from '../../shared/columnFlow';
import { shared } from './classicStyles';

/* ── Page-1-specific styles (everything else comes from classicStyles.ts) ── */
const s = StyleSheet.create({
  page: {
    fontSize: 9,
    color: '#1a1a1a',
    paddingBottom: 50,
  },
  bodyClip: {
    flex: 1,
    overflow: 'hidden',
  },

  // ── Agency header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 12,
  },
  logo: {
    width: 160,
    height: 32,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 120,
    height: 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  headerInfo: {
    flexDirection: 'row',
    gap: 24,
  },
  headerAddress: {
    fontSize: 7,
    color: '#666',
    lineHeight: 1.8,
  },
  headerContactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  headerContactLabel: {
    fontSize: 7,
    lineHeight: 1.8,
    width: 22,
    textAlign: 'right',
  },
  headerContactValue: {
    fontSize: 7,
    lineHeight: 1.8,
    color: '#666',
  },

  // ── Hero image ──
  heroImage: {
    width: '100%',
    objectFit: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroPlaceholderText: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Title block ──
  titleBlock: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headline: {
    fontWeight: 700,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#1a1a1a',
    marginBottom: 0,
  },
  locationName: {
    fontWeight: 700,
    fontSize: 44,
    letterSpacing: -0.5,
    lineHeight: 1,
    color: '#111',
    textTransform: 'uppercase',
    marginTop: -6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 5,
  },
  addressText: {
    fontSize: 7,
    letterSpacing: 1,
    color: '#999',
    textTransform: 'uppercase',
  },

  // ── Two-column body ──
  body: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingTop: 10,
    gap: 24,
  },

  // ── Page 1 body text (tighter line-height than shared) ──
  bodyText: {
    fontSize: 8.5,
    lineHeight: 1.25,
    color: '#555',
  },

  // ── Accommodation table ──
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 6.5,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
  },
  tableRowStriped: {
    backgroundColor: '#f7f7f7',
  },
  tableFloor: {
    fontSize: 8.5,
    color: '#555',
    width: '42%',
  },
  tableSqFt: {
    fontSize: 8.5,
    color: '#1a1a1a',
    fontWeight: 600,
    width: '32%',
    textAlign: 'right',
  },
  tableSqM: {
    fontSize: 7,
    color: '#888',
    width: '26%',
    textAlign: 'right',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 4,
    marginLeft: -8,
    marginRight: -8,
    borderRadius: 3,
  },

  // ── Gallery strip (page 2) ──
  gallerySection: {
    paddingHorizontal: 40,
    marginTop: 20,
  },
  galleryStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryImage: {
    flex: 1,
    objectFit: 'cover',
    borderRadius: 3,
  },

});

/** Mix a hex colour toward white by a given factor (0 = original, 1 = white). */
function lighten(hex: string, factor: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * factor);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function formatNumber(n: number | null): string {
  if (n === null || isNaN(n)) return '—';
  return n.toLocaleString('en-GB');
}

/* getTableDensity, HERO_HEIGHTS, BASE_BODY_HEIGHT imported from columnFlow */

/* ── Shared footer used on both pages ── */
function Footer({ text, textColor }: { text: string; textColor: string }) {
  if (!text) return null;
  const color = lighten(textColor, 0.4);
  return (
    <View style={shared.footerWrap}>
      <RichText text={text} style={[shared.disclaimer, { color }]} />
    </View>
  );
}

/* Hero heights & body height imported from columnFlow */

/* ── Render a single content block as PDF elements ── */
function renderBlock(
  mb: MeasuredBlock,
  idx: number,
  bodyFont: string,
  _accent: string,
  textColor: string,
  bodyColor: string,
): React.ReactNode {
  const { block } = mb;
  switch (block.type) {
    case 'label':
      return (
        <Text
          key={`lbl-${idx}`}
          style={[block.isFirst ? shared.sectionLabel : shared.sectionLabelSpaced, { fontFamily: bodyFont, color: textColor }]}
        >
          {block.text}
        </Text>
      );
    case 'richtext':
      return <RichText key={`rt-${idx}`} text={block.text} style={[s.bodyText, { color: bodyColor }]} />;
    case 'table':
      return (
        <View key={`tbl-${idx}`}>
          {block.hasDescription && (
            <View style={{ marginBottom: 8 }}>
              <RichText text={block.descriptionText} style={[s.bodyText, { color: bodyColor }]} />
            </View>
          )}
          {/* Table rows (no header) */}
          {block.rows.map((row, ri) => (
            <View style={[s.tableRow, ri % 2 === 1 ? s.tableRowStriped : {}, { paddingVertical: block.density.paddingVertical }]} key={row.id}>
              <Text style={[s.tableFloor, { fontSize: block.density.fontSize, color: bodyColor }]}>{row.floor}</Text>
              <Text style={[s.tableSqFt, { fontSize: block.density.fontSize, color: textColor }]}>
                {row.sqFt !== null ? `${formatNumber(row.sqFt)} sq ft` : '—'}
              </Text>
              <Text style={[s.tableSqM, { fontSize: block.density.fontSize - 0.5 }]}>
                {row.sqM !== null ? `${formatNumber(row.sqM)} m²` : ''}
              </Text>
            </View>
          ))}
          {block.hasTotalRow && (
            <View style={[s.tableTotalRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={[s.tableFloor, { fontWeight: 700, color: textColor }]}>Total</Text>
              <Text style={[s.tableSqFt, { fontWeight: 700, color: textColor }]}>
                {formatNumber(block.rows.reduce((sum, r) => sum + (r.sqFt ?? 0), 0))} sq ft
              </Text>
              <Text style={[s.tableSqM, { color: bodyColor }]}>
                {formatNumber(block.rows.reduce((sum, r) => sum + (r.sqM ?? 0), 0))} m²
              </Text>
            </View>
          )}
          {block.extraText && (
            <View style={{ marginTop: 8 }}>
              <RichText text={block.extraText} style={[s.bodyText, { color: bodyColor }]} />
            </View>
          )}
        </View>
      );
  }
}

export default function ClassicPage1({ data }: { data: BrochureData }) {
  const accent = data.accentColor || '#f3b229';
  const textColor = data.textColor || '#1a1a1a';
  const bodyColor = lighten(textColor, 0.15);
  const titleFont = data.titleFont || 'Playfair Display';
  const bodyFont = data.bodyFont || 'Montserrat';
  const filledRows = data.accommodation.filter((r) => r.floor?.trim() || (r.sqFt != null && r.sqFt !== 0));
  const density = getTableDensity(filledRows.length);

  const heroSize = data.heroSize ?? 'landscape';
  const HERO_HEIGHT = HERO_HEIGHTS[heroSize];
  const bodyHeight = BASE_BODY_HEIGHT - (HERO_HEIGHT - HERO_HEIGHTS.landscape);
  const gallery = data.showGallery ? (data.galleryImages ?? []).filter((img) => img.url) : [];

  // Build content stream and allocate to columns
  const stream = buildContentStream(data, filledRows, density);
  const { left, right } = allocateColumns(stream, bodyHeight);

  return (
    <>
      {/* ═══════════════ PAGE 1 ═══════════════ */}
      <Page size="A4" style={[s.page, { fontFamily: bodyFont, paddingBottom: 0, color: bodyColor }]}>
        {/* ── Accent border top ── */}
        <View style={{ height: 16, backgroundColor: accent }} />

        {/* ── Agency header ── */}
        <View style={s.header}>
          {data.agency.logoUrl ? (
            <Image src={data.agency.logoUrl} style={s.logo} />
          ) : (
            <View style={s.logoPlaceholder} />
          )}
          <View style={s.headerInfo}>
            {data.agency.address ? (
              <Text style={s.headerAddress}>{data.agency.address}</Text>
            ) : null}
            <View>
              {data.agency.telephone ? (
                <View style={s.headerContactRow}>
                  <Text style={[s.headerContactLabel, { color: accent }]}>Tel:</Text>
                  <Text style={s.headerContactValue}>{data.agency.telephone}</Text>
                </View>
              ) : null}
              {data.agency.fax ? (
                <View style={s.headerContactRow}>
                  <Text style={[s.headerContactLabel, { color: accent }]}>Fax:</Text>
                  <Text style={s.headerContactValue}>{data.agency.fax}</Text>
                </View>
              ) : null}
              {data.agency.website ? (
                <View style={s.headerContactRow}>
                  <Text style={[s.headerContactLabel, { color: accent }]}>Web:</Text>
                  <Text style={s.headerContactValue}>{data.agency.website}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Full-width hero + title below ── */}
        {data.heroImageUrl ? (
          (() => {
            const z = (data.heroZoom ?? 100) / 100;
            const px = data.heroImagePosition?.x ?? 50;
            const py = data.heroImagePosition?.y ?? 50;
            const imgStyle = [
              s.heroImage,
              {
                height: HERO_HEIGHT * z,
                width: 595 * z,
                objectPosition: `${px}% ${py}%`,
                marginLeft: -(595 * (z - 1)) * (px / 100),
                marginTop: -(HERO_HEIGHT * (z - 1)) * (py / 100),
              },
            ];
            return z > 1 ? (
              <View style={{ width: '100%', height: HERO_HEIGHT, overflow: 'hidden' }}>
                <Image src={data.heroImageUrl} style={imgStyle} />
              </View>
            ) : (
              <Image src={data.heroImageUrl} style={imgStyle} />
            );
          })()
        ) : (
          <View style={[s.heroPlaceholder, { height: HERO_HEIGHT }]}>
            <Text style={s.heroPlaceholderText}>Property Photo</Text>
          </View>
        )}

        <View style={s.titleBlock}>
          <Text style={[s.headline, { fontFamily: bodyFont, color: textColor }]}>{data.headline}</Text>
          <Text style={[s.locationName, { fontFamily: titleFont, color: textColor }]}>{data.locationName}</Text>
          {data.propertyAddress ? (
            <View style={s.addressRow}>
              <Svg width="8" height="10" viewBox="0 0 8 10">
                <Path d="M4 0C1.8 0 0 1.7 0 3.8C0 6.3 4 10 4 10C4 10 8 6.3 8 3.8C8 1.7 6.2 0 4 0Z" fill={accent} />
                <Circle cx="4" cy="3.8" r="1.5" fill="white" />
              </Svg>
              <Text style={s.addressText}>{data.propertyAddress}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Two-column body (newspaper flow, clipped to remaining page space) ── */}
        <View style={s.bodyClip}>
          <View style={s.body}>
            <View style={shared.col}>
              {left.map((mb, i) => renderBlock(mb, i, bodyFont, accent, textColor, bodyColor))}
            </View>
            <View style={shared.col}>
              {right.map((mb, i) => renderBlock(mb, i + left.length, bodyFont, accent, textColor, bodyColor))}
            </View>
          </View>
        </View>
      </Page>

      {/* ═══════════════ PAGE 2 ═══════════════ */}
      <Page size="A4" style={[s.page, { fontFamily: bodyFont, color: bodyColor }]}>
        {/* ── Page 2 header ── */}
        <View style={shared.p2header}>
          {data.agency.logoUrl ? (
            <Image src={data.agency.logoUrl} style={shared.p2logo} />
          ) : (
            <View style={shared.p2logoPlaceholder} />
          )}
        </View>

        {/* ── Two-column body ── */}
        <View style={s.body}>
          <View style={shared.col}>
            {data.lease ? (
              <>
                <Text style={[shared.sectionLabel, { fontFamily: bodyFont, color: textColor }]}>Lease</Text>
                <RichText text={data.lease} style={[shared.bodyText, { color: bodyColor }]} />
              </>
            ) : null}

            <Text style={[data.lease ? shared.sectionLabelSpaced : shared.sectionLabel, { fontFamily: bodyFont, color: textColor }]}>
              Rates
            </Text>
            <RichText
              text={data.rates || 'Interested parties are advised to make their own enquiries directly with the Local Authority.'}
              style={[shared.bodyText, { color: bodyColor }]}
            />

            <Text style={[shared.sectionLabelSpaced, { fontFamily: bodyFont, color: textColor }]}>Legal Costs</Text>
            <RichText text={data.legalCosts} style={[shared.bodyText, { color: bodyColor }]} />

            {data.epc ? (
              <>
                <Text style={[shared.sectionLabelSpaced, { fontFamily: bodyFont, color: textColor }]}>EPC</Text>
                <RichText text={data.epc} style={[shared.bodyText, { color: bodyColor }]} />
              </>
            ) : null}
          </View>

          <View style={shared.col}>
            <Text style={[shared.sectionLabel, { fontFamily: bodyFont, color: textColor }]}>Viewings</Text>
            <Text style={[shared.bodyText, { color: bodyColor }]}>
              {data.agency.telephone ? (
                <>
                  {'For viewings please call '}
                  <Text style={{ fontWeight: 700, fontSize: 8 }}>{data.agency.telephone}</Text>
                  {' or email one of our agents:'}
                </>
              ) : 'Please contact:'}
            </Text>
            {data.viewings.map((contact, i) => (
              <View style={[shared.contactItem, { borderLeftColor: accent }]} key={i}>
                {contact.name ? (
                  <Text style={[shared.contactName, { color: textColor }]}>{contact.name}</Text>
                ) : null}
                {contact.email ? (
                  <Text style={[shared.contactEmail, { color: bodyColor }]}>{contact.email}</Text>
                ) : null}
              </View>
            ))}
            {data.viewingsBlurb ? (
              <RichText text={data.viewingsBlurb} style={[shared.viewingsBlurb, { color: bodyColor }]} />
            ) : null}
          </View>
        </View>

        {/* ── Gallery (optional) ── */}
        {gallery.length > 0 && (() => {
          const galleryH = gallery.length === 1 ? 200 : gallery.length === 2 ? 160 : 140;
          return (
            <View style={s.gallerySection}>
              <View style={s.galleryStrip}>
                {gallery.map((img) => (
                  <Image
                    key={img.id}
                    src={img.url}
                    style={[
                      s.galleryImage,
                      {
                        height: galleryH,
                        maxWidth: gallery.length === 1 ? '75%' : undefined,
                        objectPosition: `${img.position?.x ?? 50}% ${img.position?.y ?? 50}%`,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })()}

        {/* ── Map ── */}
        <View style={shared.mapSection}>
          <Text style={[shared.mapLabel, { fontFamily: bodyFont, color: textColor }]}>Location</Text>
          {data.mapImageUrl ? (
            <Image src={data.mapImageUrl} style={[shared.mapImage, gallery.length > 0 ? { height: 200 } : {}]} />
          ) : (
            <View style={[shared.mapPlaceholder, gallery.length > 0 ? { height: 200 } : {}]}>
              <Text style={shared.mapPlaceholderText}>Location Map</Text>
            </View>
          )}
        </View>

        <Footer text={data.disclaimer} textColor={textColor} />
      </Page>
    </>
  );
}
