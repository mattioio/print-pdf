import { useBrochure } from '../../../context/BrochureContext';
import { Section, SectionHeading, Label, TextArea } from '../primitives';

export default function Page2Section() {
  const { data, updateField } = useBrochure();

  return (
    <>
      <SectionHeading>Additional Info</SectionHeading>
      <Section>
        <div>
          <Label>Lease</Label>
          <TextArea
            value={data.lease}
            onChange={(v) => updateField('lease', v)}
            placeholder="e.g. The premises are available by way of a new 15 year lease."
            rows={2}
          />
        </div>
        <div>
          <Label>Rates</Label>
          <TextArea
            value={data.rates}
            onChange={(v) => updateField('rates', v)}
            rows={2}
          />
        </div>
        <div>
          <Label>Legal Costs</Label>
          <TextArea
            value={data.legalCosts}
            onChange={(v) => updateField('legalCosts', v)}
            rows={2}
          />
        </div>
      </Section>
    </>
  );
}
