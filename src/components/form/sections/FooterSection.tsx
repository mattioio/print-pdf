import { useBrochure } from '../../../context/BrochureContext';
import { Section, SectionHeading, Label, TextArea } from '../primitives';

export default function FooterSection() {
  const { data, updateField } = useBrochure();

  return (
    <>
      <SectionHeading>Footer</SectionHeading>
      <Section>
        <div>
          <Label>Disclaimer</Label>
          <TextArea
            value={data.disclaimer}
            onChange={(v) => updateField('disclaimer', v)}
            placeholder="Footer disclaimer text. Use *bold* for emphasis."
            rows={4}
          />
          <p className="text-xs text-gray-400 mt-1">Use *text* for bold</p>
        </div>
      </Section>
    </>
  );
}
