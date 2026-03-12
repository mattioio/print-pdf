import { useState } from 'react';
import { useBrochure } from '../../../context/BrochureContext';
import { generateUseText } from '../../../utils/useText';
import { Section, SectionHeading, Label, TextArea } from '../primitives';

const PLANNING_CLASSES = [
  { value: 'Sui Generis', label: 'Sui Generis', hint: 'Unique uses' },
  { value: 'E', label: 'E', hint: 'Commercial' },
  { value: 'B2', label: 'B2', hint: 'Industrial' },
  { value: 'B8', label: 'B8', hint: 'Storage' },
  { value: 'C1', label: 'C1', hint: 'Hotels' },
  { value: 'C3', label: 'C3', hint: 'Dwellings' },
  { value: 'F.1', label: 'F.1', hint: 'Learning' },
  { value: 'F.2', label: 'F.2', hint: 'Community' },
];

export default function UseSection() {
  const { data, updateField } = useBrochure();
  const [showOverride, setShowOverride] = useState(() => !!data.useDescription);

  const classes = data.useClasses ?? [];
  const alternatives = data.useAlternatives ?? false;
  const hasOverride = !!data.useDescription?.trim();
  const preview = generateUseText(classes, alternatives);

  const toggleClass = (cls: string) => {
    const next = classes.includes(cls)
      ? classes.filter((c) => c !== cls)
      : [...classes, cls];
    updateField('useClasses', next);
  };

  return (
    <>
      <SectionHeading>Use</SectionHeading>
      <Section>
        {/* Planning class chips */}
        <div>
          <Label>Planning Class</Label>
          <div className={`flex flex-wrap gap-1.5 ${hasOverride ? 'opacity-40' : ''}`}>
            {PLANNING_CLASSES.map((cls) => {
              const selected = classes.includes(cls.value);
              return (
                <button
                  key={cls.value}
                  type="button"
                  onClick={() => toggleClass(cls.value)}
                  className={`
                    px-2.5 py-1 rounded-md text-xs font-medium transition-all border
                    ${selected
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                    }
                  `}
                >
                  {cls.label}
                  <span className={`ml-1 ${selected ? 'text-amber-100' : 'text-gray-400'}`}>
                    {cls.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STPP checkbox */}
        <label
          className={`flex items-center gap-2.5 cursor-pointer ${hasOverride ? 'opacity-40' : ''}`}
        >
          <input
            type="checkbox"
            checked={alternatives}
            onChange={(e) => updateField('useAlternatives', e.target.checked)}
            className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-gray-600">
            Alternative uses subject to planning
          </span>
        </label>

        {/* Preview */}
        {preview && !hasOverride && (
          <p className="text-xs text-gray-400 italic leading-relaxed">
            {preview}
          </p>
        )}

        {/* Override toggle + textarea */}
        <div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
            onClick={() => setShowOverride((v) => !v)}
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {showOverride ? <path d="M2 4l4 4 4-4" /> : <path d="M4 2l4 4-4 4" />}
            </svg>
            Override with custom text
          </button>
          {showOverride && (
            <div className="mt-1.5">
              <TextArea
                value={data.useDescription ?? ''}
                onChange={(v) => updateField('useDescription', v)}
                placeholder="e.g. The Ground Floor premises benefits from Class E planning consent. The First Floor benefits from C3 planning consent."
                rows={2}
              />
              {hasOverride && (
                <p className="text-xs text-gray-400 mt-1">
                  Custom text overrides the class toggles above.
                </p>
              )}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
