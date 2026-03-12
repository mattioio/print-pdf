import { useBrochure } from '../../../context/BrochureContext';
import { v4 as uuid } from 'uuid';
import type { AccommodationRow, BrochureData } from '../../../types/brochure';
import { buildContentStream, allocateColumns } from '../../pdf/shared/columnFlow';
import { Section, SectionHeading, Label, Input, TextArea } from '../primitives';

const P1_BODY_HEIGHT = 260;

function getTableDensity(rowCount: number) {
  if (rowCount > 14) return { paddingVertical: 1.5, fontSize: 6, headerFontSize: 5.5 };
  if (rowCount > 7) return { paddingVertical: 2, fontSize: 6.5, headerFontSize: 5.5 };
  return { paddingVertical: 3.5, fontSize: 8.5, headerFontSize: 7.5 };
}

function estimateP1Overflow(data: BrochureData): boolean {
  const filledRows = data.accommodation.filter(
    (r) => r.floor?.trim() || (r.sqFt != null && r.sqFt !== 0),
  );
  const density = getTableDensity(filledRows.length);
  const stream = buildContentStream(data, filledRows, density);
  const { right } = allocateColumns(stream, P1_BODY_HEIGHT);
  const rightTotal = right.reduce((sum, mb) => sum + mb.height, 0);
  return rightTotal > P1_BODY_HEIGHT;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-GB');
}

export default function AccommodationSection() {
  const { data, updateField } = useBrochure();

  const updateAccommodation = (
    index: number,
    field: keyof AccommodationRow,
    value: string,
  ) => {
    const rows = [...data.accommodation];
    if (field === 'sqFt') {
      const cleaned = value.replace(/[^0-9]/g, '');
      const num = cleaned === '' ? null : parseInt(cleaned, 10);
      rows[index] = {
        ...rows[index],
        sqFt: num,
        sqM: num !== null ? Math.round(num * 0.092903 * 100) / 100 : null,
      };
    } else if (field === 'sqM') {
      const cleaned = value.replace(/[^0-9.]/g, '');
      const num = cleaned === '' || cleaned === '.' ? null : parseFloat(cleaned);
      rows[index] = {
        ...rows[index],
        sqM: num !== null && !isNaN(num) ? num : null,
        sqFt: num !== null && !isNaN(num) ? Math.round(num / 0.092903) : null,
      };
    } else {
      rows[index] = { ...rows[index], [field]: value };
    }
    updateField('accommodation', rows);
  };

  const addRow = () => {
    updateField('accommodation', [
      ...data.accommodation,
      { id: uuid(), floor: '', sqFt: null, sqM: null },
    ]);
  };

  const removeRow = (index: number) => {
    updateField('accommodation', data.accommodation.filter((_, i) => i !== index));
  };

  const totalSqFt = data.accommodation.reduce((sum, r) => sum + (r.sqFt ?? 0), 0);
  const totalSqM = data.accommodation.reduce((sum, r) => sum + (r.sqM ?? 0), 0);
  const hasMultipleRows = data.accommodation.length > 1;
  const hasAnyArea = data.accommodation.some((r) => (r.sqFt != null && r.sqFt !== 0) || (r.sqM != null && r.sqM !== 0));

  return (
    <>
      <SectionHeading>Accommodation</SectionHeading>
      <Section>
        <div>
          <Label>Description</Label>
          <TextArea
            value={data.accommodationDescription}
            onChange={(v) => updateField('accommodationDescription', v)}
            placeholder="e.g. The unit is arranged over Ground, Basement, First, Second and Third floors..."
            rows={2}
          />
        </div>
        <div>
          <Label>Rent</Label>
          <Input
            value={data.rent}
            onChange={(v) => updateField('rent', v)}
            placeholder="e.g. Upon Application."
          />
        </div>
      </Section>

      {/* Premises Licence — optional toggle card */}
      <div className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={!!data.premisesLicence}
              onChange={(e) => {
                if (e.target.checked) {
                  updateField('premisesLicence', 'The premises benefits from a 24 hour licence');
                } else {
                  updateField('premisesLicence', '');
                }
              }}
            />
            <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-amber-500 transition-colors" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-gray-700">Premises Licence</span>
        </label>
        {!!data.premisesLicence && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100">
            <Input
              value={data.premisesLicence}
              onChange={(v) => updateField('premisesLicence', v)}
              placeholder="e.g. The premises benefits from a 24 hour licence"
            />
          </div>
        )}
      </div>

      {/* Schedule — own card */}
      <Section>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label>Schedule</Label>
            <button
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              onClick={addRow}
            >
              + Add Floor
            </button>
          </div>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_5.5rem_4.5rem_1.5rem] gap-x-2 px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            <span>Floor</span>
            <span className="text-right">Sq ft</span>
            <span className="text-right">m²</span>
            <span />
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {data.accommodation.map((row, i) => (
              <div
                key={row.id}
                className="group grid grid-cols-[1fr_5.5rem_4.5rem_1.5rem] gap-x-2 items-center py-1"
              >
                <input
                  className="w-full bg-transparent rounded px-1 py-0.5 text-sm text-gray-800 placeholder:text-gray-300 hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
                  value={row.floor}
                  onChange={(e) => updateAccommodation(i, 'floor', e.target.value)}
                  placeholder="Floor name"
                  title="Floor name"
                />
                <input
                  className="w-full bg-transparent rounded px-1 py-0.5 text-sm tabular-nums text-right text-gray-800 placeholder:text-gray-300 hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
                  type="text"
                  inputMode="numeric"
                  value={row.sqFt != null ? formatNumber(row.sqFt) : ''}
                  onChange={(e) => updateAccommodation(i, 'sqFt', e.target.value.replace(/,/g, ''))}
                  placeholder="—"
                  title="Area (sq ft)"
                />
                <input
                  className="w-full bg-transparent rounded px-1 py-0.5 text-xs tabular-nums text-right text-gray-400 placeholder:text-gray-300 hover:bg-gray-50 focus:bg-white focus:text-gray-800 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
                  type="text"
                  inputMode="decimal"
                  value={row.sqM != null ? row.sqM : ''}
                  onChange={(e) => updateAccommodation(i, 'sqM', e.target.value)}
                  placeholder="—"
                  title="Area (m²)"
                />
                {data.accommodation.length > 1 ? (
                  <button
                    className="flex items-center justify-center w-5 h-5 rounded text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                    onClick={() => removeRow(i)}
                    title="Remove floor"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 2l8 8M10 2l-8 8" />
                    </svg>
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
          {/* Total row */}
          {hasMultipleRows && hasAnyArea && (
            <div className="grid grid-cols-[1fr_5.5rem_4.5rem_1.5rem] gap-x-2 items-center border-t border-gray-200 pt-1.5 mt-0.5">
              <span className="text-sm font-semibold text-gray-600 px-1">Total</span>
              <span className="text-sm font-semibold tabular-nums text-gray-900 text-right px-1">
                {formatNumber(totalSqFt)}
              </span>
              <span className="text-xs tabular-nums text-gray-400 text-right pr-1">
                {formatNumber(Math.round(totalSqM * 100) / 100)}
              </span>
              <span />
            </div>
          )}
          {estimateP1Overflow(data) && (
            <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              <span className="font-medium">Layout note:</span> Content may not fit on page 1. Consider reducing rows or shortening descriptions.
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
