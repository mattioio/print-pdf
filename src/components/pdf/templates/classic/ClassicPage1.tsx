import { Page, View, Text, Image, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer';
import type { BrochureData } from '../../../../types/brochure';
import RichText from '../../shared/RichText';
import { buildContentStream, allocateColumns } from '../../shared/columnFlow';
import type { MeasuredBlock } from '../../shared/columnFlow';
import { shared, DISCLAIMER } from './classicStyles';

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
    height: 368,
    objectFit: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: 368,
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
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

  // ── Footer (with background colour, slightly different from shared) ──
  footerWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
  },
  disclaimer: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    fontSize: 5.5,
    color: '#999',
    lineHeight: 1.5,
  },
  disclaimerBold: {
    fontWeight: 700,
    fontSize: 5.5,
    color: '#777',
  },
});

function formatNumber(n: number | null): string {
  if (n === null || isNaN(n)) return '—';
  return n.toLocaleString('en-GB');
}

/* ── Auto-compact density for accommodation table ── */
const COMPACT_THRESHOLD = 7;
const ULTRA_COMPACT_THRESHOLD = 14;

function getTableDensity(rowCount: number) {
  if (rowCount > ULTRA_COMPACT_THRESHOLD) return { paddingVertical: 1.5, fontSize: 6, headerFontSize: 5.5 };
  if (rowCount > COMPACT_THRESHOLD) return { paddingVertical: 2, fontSize: 6.5, headerFontSize: 5.5 };
  return { paddingVertical: 3.5, fontSize: 8.5, headerFontSize: 7.5 };
}

/* ── Shared footer used on both pages ── */
function Footer() {
  return (
    <View style={s.footerWrap}>
      <Text style={s.disclaimer}>
        <Text style={s.disclaimerBold}>Misrepresentation Act: </Text>
        {DISCLAIMER}
      </Text>
    </View>
  );
}

/* ── Available body height on page 1 ── */
const P1_BODY_HEIGHT = 260;

/* ── Render a single content block as PDF elements ── */
function renderBlock(
  mb: MeasuredBlock,
  idx: number,
  bodyFont: string,
  accent: string,
): React.ReactNode {
  const { block } = mb;
  switch (block.type) {
    case 'label':
      return (
        <Text
          key={`lbl-${idx}`}
          style={[block.isFirst ? shared.sectionLabel : shared.sectionLabelSpaced, { fontFamily: bodyFont }]}
        >
          {block.text}
        </Text>
      );
    case 'richtext':
      return <RichText key={`rt-${idx}`} text={block.text} style={s.bodyText} />;
    case 'table':
      return (
        <View key={`tbl-${idx}`}>
          {block.hasDescription && (
            <View style={{ marginBottom: 8 }}>
              <RichText text={block.descriptionText} style={s.bodyText} />
            </View>
          )}
          {/* Table rows (no header) */}
          {block.rows.map((row) => (
            <View style={[s.tableRow, { paddingVertical: block.density.paddingVertical }]} key={row.id}>
              <Text style={[s.tableFloor, { fontSize: block.density.fontSize }]}>{row.floor}</Text>
              <Text style={[s.tableSqFt, { fontSize: block.density.fontSize }]}>
                {row.sqFt !== null ? `${formatNumber(row.sqFt)} sq ft` : '—'}
              </Text>
              <Text style={[s.tableSqM, { fontSize: block.density.fontSize - 0.5 }]}>
                {row.sqM !== null ? `${formatNumber(row.sqM)} m²` : ''}
              </Text>
            </View>
          ))}
          {block.hasTotalRow && (
            <View style={s.tableTotalRow}>
              <Text style={[s.tableFloor, { fontWeight: 700, color: '#1a1a1a' }]}>Total</Text>
              <Text style={[s.tableSqFt, { color: accent }]}>
                {formatNumber(block.rows.reduce((sum, r) => sum + (r.sqFt ?? 0), 0))} sq ft
              </Text>
              <Text style={s.tableSqM}>
                {formatNumber(block.rows.reduce((sum, r) => sum + (r.sqM ?? 0), 0))} m²
              </Text>
            </View>
          )}
        </View>
      );
  }
}

export default function ClassicPage1({ data }: { data: BrochureData }) {
  const accent = data.accentColor || '#f3b229';
  const titleFont = data.titleFont || 'Playfair Display';
  const bodyFont = data.bodyFont || 'Montserrat';
  const filledRows = data.accommodation.filter((r) => r.floor?.trim() || (r.sqFt != null && r.sqFt !== 0));
  const density = getTableDensity(filledRows.length);

  // Build content stream and allocate to columns
  const stream = buildContentStream(data, filledRows, density);
  const { left, right } = allocateColumns(stream, P1_BODY_HEIGHT);

  return (
    <>
      {/* ═══════════════ PAGE 1 ═══════════════ */}
      <Page size="A4" style={[s.page, { fontFamily: bodyFont, paddingBottom: 0 }]}>
        {/* ── Top accent bar ── */}
        <View style={[shared.topBar, { backgroundColor: accent }]} />

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

        {/* ── Hero photo ── */}
        {data.heroImageUrl ? (
          <Image
            src={data.heroImageUrl}
            style={[
              s.heroImage,
              {
                objectPosition: `${data.heroImagePosition?.x ?? 50}% ${data.heroImagePosition?.y ?? 50}%`,
              },
            ]}
          />
        ) : (
          <View style={s.heroPlaceholder}>
            <Text style={s.heroPlaceholderText}>Property Photo</Text>
          </View>
        )}

        {/* ── Title block ── */}
        <View style={s.titleBlock}>
          <Text style={[s.headline, { fontFamily: bodyFont }]}>{data.headline}</Text>
          <Text style={[s.locationName, { fontFamily: titleFont }]}>{data.locationName}</Text>
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
              {left.map((mb, i) => renderBlock(mb, i, bodyFont, accent))}
            </View>
            <View style={shared.col}>
              {right.map((mb, i) => renderBlock(mb, i + left.length, bodyFont, accent))}
            </View>
          </View>
        </View>
      </Page>

      {/* ═══════════════ PAGE 2 ═══════════════ */}
      <Page size="A4" style={[s.page, { fontFamily: bodyFont }]}>
        {/* ── Top accent bar ── */}
        <View style={[shared.topBar, { backgroundColor: accent }]} />

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
                <Text style={[shared.sectionLabel, { fontFamily: bodyFont }]}>Lease</Text>
                <RichText text={data.lease} style={shared.bodyText} />
              </>
            ) : null}

            <Text style={[data.lease ? shared.sectionLabelSpaced : shared.sectionLabel, { fontFamily: bodyFont }]}>
              Rates
            </Text>
            <RichText
              text={data.rates || 'Interested parties are advised to make their own enquiries directly with the Local Authority.'}
              style={shared.bodyText}
            />

            <Text style={[shared.sectionLabelSpaced, { fontFamily: bodyFont }]}>Legal Costs</Text>
            <RichText text={data.legalCosts} style={shared.bodyText} />

            {data.epc ? (
              <>
                <Text style={[shared.sectionLabelSpaced, { fontFamily: bodyFont }]}>EPC</Text>
                <RichText text={data.epc} style={shared.bodyText} />
              </>
            ) : null}
          </View>

          <View style={shared.col}>
            <Text style={[shared.sectionLabel, { fontFamily: bodyFont }]}>Viewings</Text>
            <Text style={shared.bodyText}>
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
                  <Text style={shared.contactName}>{contact.name}</Text>
                ) : null}
                {contact.email ? (
                  <Text style={shared.contactEmail}>{contact.email}</Text>
                ) : null}
              </View>
            ))}
            {data.viewingsBlurb ? (
              <RichText text={data.viewingsBlurb} style={shared.viewingsBlurb} />
            ) : null}
          </View>
        </View>

        {/* ── Map ── */}
        <View style={shared.mapSection}>
          <Text style={[shared.mapLabel, { fontFamily: bodyFont }]}>Location</Text>
          {data.mapImageUrl ? (
            <Image src={data.mapImageUrl} style={shared.mapImage} />
          ) : (
            <View style={shared.mapPlaceholder}>
              <Text style={shared.mapPlaceholderText}>Location Map</Text>
            </View>
          )}
        </View>

        <Footer />
      </Page>
    </>
  );
}
