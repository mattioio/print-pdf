import { Page, View, Text, Image, Svg, Path, Circle } from '@react-pdf/renderer';
import type { BrochureData } from '../../../../types/brochure';
import RichText from '../../shared/RichText';
import { buildContentStream, allocateColumns } from '../../shared/columnFlow';
import type { MeasuredBlock } from '../../shared/columnFlow';
import { ms, DISCLAIMER } from './modernStyles';

/* ── Density (same logic as Classic) ── */
function getTableDensity(rowCount: number) {
  if (rowCount > 14) return { paddingVertical: 1.5, fontSize: 6, headerFontSize: 5.5 };
  if (rowCount > 7) return { paddingVertical: 2, fontSize: 6.5, headerFontSize: 5.5 };
  return { paddingVertical: 3, fontSize: 8.5, headerFontSize: 7.5 };
}

function formatNumber(n: number | null): string {
  if (n === null || isNaN(n)) return '—';
  return n.toLocaleString('en-GB');
}

const P1_BODY_HEIGHT = 240;

/* ── Render a single content block ── */
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
          style={[block.isFirst ? ms.sectionLabel : ms.sectionLabelSpaced, { fontFamily: bodyFont, color: accent }]}
        >
          {block.text}
        </Text>
      );
    case 'richtext':
      return <RichText key={`rt-${idx}`} text={block.text} style={ms.bodyText} />;
    case 'table':
      return (
        <View key={`tbl-${idx}`}>
          {block.hasDescription && (
            <View style={{ marginBottom: 8 }}>
              <RichText text={block.descriptionText} style={ms.bodyText} />
            </View>
          )}
          {block.rows.map((row) => (
            <View style={[ms.tableRow, { paddingVertical: block.density.paddingVertical }]} key={row.id}>
              <Text style={[ms.tableFloor, { fontSize: block.density.fontSize }]}>{row.floor}</Text>
              <Text style={[ms.tableSqFt, { fontSize: block.density.fontSize }]}>
                {row.sqFt !== null ? `${formatNumber(row.sqFt)} sq ft` : '—'}
              </Text>
              <Text style={[ms.tableSqM, { fontSize: block.density.fontSize - 0.5 }]}>
                {row.sqM !== null ? `${formatNumber(row.sqM)} m²` : ''}
              </Text>
            </View>
          ))}
          {block.hasTotalRow && (
            <View style={ms.tableTotalRow}>
              <Text style={[ms.tableFloor, { fontWeight: 700, color: '#222' }]}>Total</Text>
              <Text style={[ms.tableSqFt, { color: accent }]}>
                {formatNumber(block.rows.reduce((sum, r) => sum + (r.sqFt ?? 0), 0))} sq ft
              </Text>
              <Text style={ms.tableSqM}>
                {formatNumber(block.rows.reduce((sum, r) => sum + (r.sqM ?? 0), 0))} m²
              </Text>
            </View>
          )}
        </View>
      );
  }
}

/* ── Footer ── */
function Footer() {
  return (
    <View style={ms.footerWrap}>
      <Text style={ms.disclaimer}>
        <Text style={ms.disclaimerBold}>Misrepresentation Act: </Text>
        {DISCLAIMER}
      </Text>
    </View>
  );
}

export default function ModernPage1({ data }: { data: BrochureData }) {
  const accent = data.accentColor || '#f3b229';
  const titleFont = data.titleFont || 'Playfair Display';
  const bodyFont = data.bodyFont || 'Montserrat';
  const filledRows = data.accommodation.filter((r) => r.floor?.trim() || (r.sqFt != null && r.sqFt !== 0));
  const density = getTableDensity(filledRows.length);

  const gallery = (data.galleryImages ?? []).filter((img) => img.url);
  const hasGallery = gallery.length >= 2;
  const HERO_HEIGHT = hasGallery ? 260 : 340;
  const GALLERY_HEIGHT = 80;

  const stream = buildContentStream(data, filledRows, density);
  const { left, right } = allocateColumns(stream, P1_BODY_HEIGHT);

  return (
    <>
      {/* ═══════════════ PAGE 1 ═══════════════ */}
      <Page size="A4" style={[ms.page, { fontFamily: bodyFont, paddingBottom: 0 }]}>
        {/* ── Hero photo (full bleed, no padding) ── */}
        <View style={{ position: 'relative' }}>
          {data.heroImageUrl ? (
            <Image
              src={data.heroImageUrl}
              style={[
                ms.heroImage,
                {
                  height: HERO_HEIGHT,
                  objectPosition: `${data.heroImagePosition?.x ?? 50}% ${data.heroImagePosition?.y ?? 50}%`,
                },
              ]}
            />
          ) : (
            <View style={[ms.heroPlaceholder, { height: HERO_HEIGHT }]}>
              <Text style={ms.heroPlaceholderText}>Property Photo</Text>
            </View>
          )}

          {/* Agency logo overlaid on hero */}
          {data.agency.logoUrl && (
            <View style={ms.logoOverlay}>
              <View style={ms.logoOverlayBg}>
                <Image src={data.agency.logoUrl} style={ms.logoOverlayImg} />
              </View>
            </View>
          )}
        </View>

        {/* ── Gallery strip ── */}
        {hasGallery && (
          <View style={[ms.galleryStrip, { height: GALLERY_HEIGHT }]}>
            {gallery.map((img) => (
              <Image
                key={img.id}
                src={img.url}
                style={[
                  ms.galleryImage,
                  {
                    height: GALLERY_HEIGHT,
                    objectPosition: `${img.position?.x ?? 50}% ${img.position?.y ?? 50}%`,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* ── Title band ── */}
        <View style={ms.titleBand}>
          <Text style={[ms.headline, { fontFamily: bodyFont }]}>{data.headline}</Text>
          <Text style={[ms.locationName, { fontFamily: titleFont }]}>{data.locationName}</Text>
          {data.propertyAddress && (
            <View style={ms.addressRow}>
              <Svg width="8" height="10" viewBox="0 0 8 10">
                <Path d="M4 0C1.8 0 0 1.7 0 3.8C0 6.3 4 10 4 10C4 10 8 6.3 8 3.8C8 1.7 6.2 0 4 0Z" fill={accent} />
                <Circle cx="4" cy="3.8" r="1.5" fill="white" />
              </Svg>
              <Text style={ms.addressText}>{data.propertyAddress}</Text>
            </View>
          )}
        </View>

        {/* ── Two-column body ── */}
        <View style={ms.bodyClip}>
          <View style={ms.body}>
            <View style={ms.col}>
              {left.map((mb, i) => renderBlock(mb, i, bodyFont, accent))}
            </View>
            <View style={ms.col}>
              {right.map((mb, i) => renderBlock(mb, i + left.length, bodyFont, accent))}
            </View>
          </View>
        </View>
      </Page>

      {/* ═══════════════ PAGE 2 ═══════════════ */}
      <Page size="A4" style={[ms.page, { fontFamily: bodyFont, paddingBottom: 50 }]}>
        {/* ── Header ── */}
        <View style={ms.p2header}>
          {data.agency.logoUrl ? (
            <Image src={data.agency.logoUrl} style={ms.p2logo} />
          ) : (
            <View style={ms.p2logoPlaceholder} />
          )}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {data.agency.telephone && (
              <Text style={ms.p2headerContact}>{data.agency.telephone}</Text>
            )}
            {data.agency.website && (
              <Text style={ms.p2headerContact}>{data.agency.website}</Text>
            )}
          </View>
        </View>
        <View style={[ms.p2headerLine, { backgroundColor: accent }]} />

        {/* ── Two-column body ── */}
        <View style={[ms.body, { paddingTop: 20 }]}>
          <View style={ms.col}>
            {data.lease ? (
              <>
                <Text style={[ms.sectionLabel, { fontFamily: bodyFont, color: accent }]}>Lease</Text>
                <RichText text={data.lease} style={ms.bodyText} />
              </>
            ) : null}

            <Text style={[data.lease ? ms.sectionLabelSpaced : ms.sectionLabel, { fontFamily: bodyFont, color: accent }]}>
              Rates
            </Text>
            <RichText
              text={data.rates || 'Interested parties are advised to make their own enquiries directly with the Local Authority.'}
              style={ms.bodyText}
            />

            <Text style={[ms.sectionLabelSpaced, { fontFamily: bodyFont, color: accent }]}>Legal Costs</Text>
            <RichText text={data.legalCosts} style={ms.bodyText} />

            {data.epc ? (
              <>
                <Text style={[ms.sectionLabelSpaced, { fontFamily: bodyFont, color: accent }]}>EPC</Text>
                <RichText text={data.epc} style={ms.bodyText} />
              </>
            ) : null}
          </View>

          <View style={ms.col}>
            <Text style={[ms.sectionLabel, { fontFamily: bodyFont, color: accent }]}>Viewings</Text>
            <Text style={ms.bodyText}>
              {data.agency.telephone ? (
                <>
                  {'For viewings please call '}
                  <Text style={{ fontWeight: 700, fontSize: 8.5 }}>{data.agency.telephone}</Text>
                  {' or email one of our agents:'}
                </>
              ) : 'Please contact:'}
            </Text>
            {data.viewings.map((contact, i) => (
              <View style={[ms.contactItem, { borderLeftColor: accent }]} key={i}>
                {contact.name && <Text style={ms.contactName}>{contact.name}</Text>}
                {contact.email && <Text style={ms.contactEmail}>{contact.email}</Text>}
              </View>
            ))}
            {data.viewingsBlurb && (
              <RichText text={data.viewingsBlurb} style={ms.viewingsBlurb} />
            )}
          </View>
        </View>

        {/* ── Map ── */}
        <View style={ms.mapSection}>
          <Text style={[ms.sectionLabel, { fontFamily: bodyFont, color: accent, marginBottom: 10 }]}>Location</Text>
          {data.mapImageUrl ? (
            <Image src={data.mapImageUrl} style={ms.mapImage} />
          ) : (
            <View style={ms.mapPlaceholder}>
              <Text style={ms.mapPlaceholderText}>Location Map</Text>
            </View>
          )}
        </View>

        <Footer />
      </Page>
    </>
  );
}
