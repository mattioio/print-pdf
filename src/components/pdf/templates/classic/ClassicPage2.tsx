import { Page, View, Text, Image } from '@react-pdf/renderer';
import type { BrochureData } from '../../../../types/brochure';
import RichText from '../../shared/RichText';
import { shared as s } from './classicStyles';

/** Mix a hex colour toward white by a given factor (0 = original, 1 = white). */
function lighten(hex: string, factor: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * factor);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export default function ClassicPage2({ data }: { data: BrochureData }) {
  const accent = data.accentColor || '#f3b229';
  const textColor = data.textColor || '#1a1a1a';
  const bodyFont = data.bodyFont || 'Montserrat';

  return (
    <Page size="A4" style={{ fontSize: 9, color: '#1a1a1a', fontFamily: bodyFont }}>
      {/* ── Top accent bar ── */}
      <View style={[s.topBar, { backgroundColor: accent }]} />

      {/* ── Header ── */}
      <View style={s.p2header}>
        {data.agency.logoUrl ? (
          <Image src={data.agency.logoUrl} style={s.p2logo} />
        ) : (
          <View style={s.p2logoPlaceholder} />
        )}
      </View>

      {/* ── Two-column body ── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 40, paddingTop: 24, gap: 24 }}>
        <View style={s.col}>
          {data.lease ? (
            <>
              <Text style={[s.sectionLabel, { fontFamily: bodyFont }]}>Lease</Text>
              <RichText text={data.lease} style={s.bodyText} />
            </>
          ) : null}

          <Text style={[data.lease ? s.sectionLabelSpaced : s.sectionLabel, { fontFamily: bodyFont }]}>
            Rates
          </Text>
          <RichText
            text={data.rates || 'Interested parties are advised to make their own enquiries directly with the Local Authority.'}
            style={s.bodyText}
          />

          <Text style={[s.sectionLabelSpaced, { fontFamily: bodyFont }]}>Legal Costs</Text>
          <RichText text={data.legalCosts} style={s.bodyText} />

          {data.epc ? (
            <>
              <Text style={[s.sectionLabelSpaced, { fontFamily: bodyFont }]}>EPC</Text>
              <RichText text={data.epc} style={s.bodyText} />
            </>
          ) : null}
        </View>

        <View style={s.col}>
          <Text style={[s.sectionLabel, { fontFamily: bodyFont }]}>Viewings</Text>
          <Text style={s.bodyText}>
            {data.agency.telephone ? (
              <>
                {'For viewings please call '}
                <Text style={{ fontWeight: 700, fontSize: 8 }}>{data.agency.telephone}</Text>
                {' or email one of our agents:'}
              </>
            ) : 'Please contact:'}
          </Text>
          {data.viewings.map((contact, i) => (
            <View style={[s.contactItem, { borderLeftColor: accent }]} key={i}>
              {contact.name ? (
                <Text style={s.contactName}>{contact.name}</Text>
              ) : null}
              {contact.email ? (
                <Text style={s.contactEmail}>{contact.email}</Text>
              ) : null}
            </View>
          ))}
          {data.viewingsBlurb ? (
            <RichText text={data.viewingsBlurb} style={s.viewingsBlurb} />
          ) : null}
        </View>
      </View>

      {/* ── Map ── */}
      <View style={s.mapSection}>
        <Text style={[s.mapLabel, { fontFamily: bodyFont }]}>Location</Text>
        {data.mapImageUrl ? (
          <Image src={data.mapImageUrl} style={s.mapImage} />
        ) : (
          <View style={s.mapPlaceholder}>
            <Text style={s.mapPlaceholderText}>Location Map</Text>
          </View>
        )}
      </View>

      {/* ── Footer ── */}
      {data.disclaimer ? (
        <View style={s.footerWrap}>
          <RichText text={data.disclaimer} style={[s.disclaimer, { color: lighten(textColor, 0.4) }]} />
        </View>
      ) : null}
    </Page>
  );
}
