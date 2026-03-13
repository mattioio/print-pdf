/**
 * Newspaper-style column flow engine for @react-pdf/renderer.
 *
 * @react-pdf has no CSS columns or linked text frames. This module
 * pre-computes which content goes in which column by estimating
 * block heights and greedily filling left → right.
 */

import type { BrochureData, AccommodationRow } from '../../../types/brochure';
import { generateUseText } from '../../../utils/useText';

/* ═══════════════ Layout constants ═══════════════ */

export const HERO_HEIGHTS = { landscape: 368, tall: 500 } as const;
export const BASE_BODY_HEIGHT = 260;

/* ── Auto-compact density for accommodation table ── */
const COMPACT_THRESHOLD = 7;
const ULTRA_COMPACT_THRESHOLD = 14;

export function getTableDensity(rowCount: number): TableDensity {
  if (rowCount > ULTRA_COMPACT_THRESHOLD) return { paddingVertical: 1.5, fontSize: 6, headerFontSize: 5.5 };
  if (rowCount > COMPACT_THRESHOLD) return { paddingVertical: 2, fontSize: 6.5, headerFontSize: 5.5 };
  return { paddingVertical: 3.5, fontSize: 8.5, headerFontSize: 7.5 };
}

/* ═══════════════ Types ═══════════════ */

export type ContentBlock =
  | { type: 'label'; text: string; isFirst: boolean }
  | { type: 'richtext'; text: string }
  | { type: 'column-break' }
  | {
      type: 'table';
      rows: AccommodationRow[];
      hasDescription: boolean;
      descriptionText: string;
      hasTotalRow: boolean;
      density: TableDensity;
      extraText?: string;
    };

export interface TableDensity {
  paddingVertical: number;
  fontSize: number;
  headerFontSize: number;
}

export interface MeasuredBlock {
  block: ContentBlock;
  height: number;
}

export interface ColumnAllocation {
  left: MeasuredBlock[];
  right: MeasuredBlock[];
  overflowed: boolean;
}

/* ═══════════════ Height estimation constants ═══════════════ */

const LINE_H = 8.5 * 1.25; // 10.625pt — bodyText fontSize × lineHeight
const CHARS_PER_LINE = 53; // conservative for ~261pt column at 8.5pt Montserrat
const LABEL_H = 20; // label text + marginBottom 8
const LABEL_SPACING = 16; // marginTop on non-first labels
const BULLET_MB = 2; // bulletRow marginBottom
const EMPTY_LINE_H = 4; // blank-line spacer in RichText
const TABLE_HEADER_H = 15; // header row height
const TABLE_TOTAL_H = 15; // total row height
const TABLE_DESC_MB = 8; // accommodationDescription marginBottom

/* ═══════════════ Height estimation ═══════════════ */

function estimateLineHeight(line: string): number {
  const trimmed = line.trim();
  if (trimmed === '') return EMPTY_LINE_H;
  if (/^[-•]\s+/.test(trimmed)) return LINE_H + BULLET_MB;
  const wrappedLines = Math.max(1, Math.ceil(trimmed.length / CHARS_PER_LINE));
  return wrappedLines * LINE_H;
}

function estimateTextHeight(text: string): number {
  if (!text) return 0;
  return text.split('\n').reduce((h, line) => h + estimateLineHeight(line), 0);
}

function estimateTableHeight(
  rowCount: number,
  _density: TableDensity,
  hasTotalRow: boolean,
  hasDescription: boolean,
  descriptionText: string,
  extraText?: string,
): number {
  // Use same simple row heights as the existing density tiers
  const rowH = rowCount > 14 ? 9 : rowCount > 7 ? 11 : 15;
  let h = TABLE_HEADER_H + rowCount * rowH;
  if (hasTotalRow) h += TABLE_TOTAL_H;
  if (hasDescription) h += estimateTextHeight(descriptionText) + TABLE_DESC_MB;
  if (extraText) h += TABLE_DESC_MB + estimateTextHeight(extraText);
  return h;
}

function measureBlock(block: ContentBlock): number {
  switch (block.type) {
    case 'label':
      return block.isFirst ? LABEL_H : LABEL_H + LABEL_SPACING;
    case 'richtext':
      return estimateTextHeight(block.text);
    case 'column-break':
      return 0;
    case 'table':
      return estimateTableHeight(
        block.rows.length,
        block.density,
        block.hasTotalRow,
        block.hasDescription,
        block.descriptionText,
        block.extraText,
      );
  }
}

/* ═══════════════ Auto-generate accommodation blurb ═══════════════ */

function generateAccommodationDescription(floors: string[]): string {
  if (floors.length === 0) return '';
  const suffix = 'and has the following approximate net internal areas:';
  if (floors.length === 1) {
    return `The unit is arranged over the ${floors[0]} only ${suffix}`;
  }
  const list = floors.slice(0, -1).join(', ') + ' and ' + floors[floors.length - 1];
  return `The unit is arranged over ${list} floors ${suffix}`;
}

/* ═══════════════ Content stream builder ═══════════════ */

export function buildContentStream(
  data: BrochureData,
  filledRows: AccommodationRow[],
  density: TableDensity,
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let isFirst = true;

  const addSection = (label: string, text: string) => {
    if (!text) return;
    blocks.push({ type: 'label', text: label, isFirst });
    blocks.push({ type: 'richtext', text });
    isFirst = false;
  };

  // Left column content
  // 1. Location
  addSection('Location', data.locationDescription);

  // 2. Use (optional — override text takes priority, else generate from classes)
  const useText = data.useDescription || generateUseText(data.useClasses ?? [], data.useAlternatives ?? false);
  if (useText) {
    addSection('Use', useText);
  }

  // 3. Rent
  addSection('Rent', data.rent);

  // 4. Premises Licence (optional)
  if (data.premisesLicence) {
    addSection('Premises Licence', data.premisesLicence);
  }

  // Force right column — Accommodation always starts at top right
  blocks.push({ type: 'column-break' });

  // 5. Accommodation (table — atomic unit)
  blocks.push({ type: 'label', text: 'Accommodation', isFirst: true });
  isFirst = false;
  const autoDescription = generateAccommodationDescription(
    filledRows.map((r) => r.floor).filter(Boolean),
  );
  blocks.push({
    type: 'table',
    rows: filledRows,
    hasDescription: !!autoDescription,
    descriptionText: autoDescription,
    hasTotalRow: filledRows.length > 1,
    density,
    extraText: data.accommodationExtra?.trim() || undefined,
  });

  return blocks;
}

/* ═══════════════ Paragraph-level splitting ═══════════════ */

function splitRichText(
  text: string,
  available: number,
): { fitText: string; overflowText: string } | null {
  const lines = text.split('\n');
  let accumulated = 0;
  let splitIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const lh = estimateLineHeight(lines[i]);
    if (accumulated + lh > available) break;
    accumulated += lh;
    splitIdx = i + 1;
  }

  if (splitIdx === 0) return null; // nothing fits
  if (splitIdx >= lines.length) return null; // everything fits (shouldn't reach here)

  return {
    fitText: lines.slice(0, splitIdx).join('\n'),
    overflowText: lines.slice(splitIdx).join('\n'),
  };
}

/* ═══════════════ Column allocation algorithm ═══════════════ */

export function allocateColumns(
  blocks: ContentBlock[],
  availableHeight: number,
): ColumnAllocation {
  const left: MeasuredBlock[] = [];
  const right: MeasuredBlock[] = [];
  let remaining = availableHeight;
  let switched = false;
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Column break — force switch to right column
    if (block.type === 'column-break') {
      if (!switched) {
        switched = true;
        remaining = availableHeight;
      }
      i++;
      continue;
    }

    const height = measureBlock(block);

    // Fits in current column?
    if (height <= remaining) {
      // Look-ahead: if this is a label in the left column, check that its
      // content block also fits (at least 1 line for richtext, or fully for
      // atomic blocks like tables). If not, move the label + content to the
      // right column together so they don't get separated.
      if (!switched && block.type === 'label' && i + 1 < blocks.length) {
        const nextBlock = blocks[i + 1];
        const nextHeight = measureBlock(nextBlock);
        const minContentH = nextBlock.type === 'richtext' ? LINE_H : nextHeight;
        if (remaining - height < minContentH) {
          // Not enough room for label + at least 1 line/full content → switch
          switched = true;
          remaining = availableHeight;
          right.push({
            block: { ...block, isFirst: true } as ContentBlock,
            height: LABEL_H,
          });
          remaining -= LABEL_H;
          i++;
          continue;
        }
      }
      (switched ? right : left).push({ block, height });
      remaining -= height;
      i++;
      continue;
    }

    // Doesn't fit — if still in left column, try to handle it
    if (!switched) {
      // Label + content grouping: if this is a label and next block won't fit,
      // move both to the right column together
      if (block.type === 'label' && i + 1 < blocks.length) {
        const nextHeight = measureBlock(blocks[i + 1]);
        const minContentH = blocks[i + 1].type === 'richtext' ? LINE_H : nextHeight;
        if (remaining < height + minContentH) {
          // Not enough room for label + at least 1 line of content → switch
          switched = true;
          remaining = availableHeight;
          // Re-mark as first in column
          left.length === 0 || true; // continue to push below
          right.push({
            block: { ...block, isFirst: true } as ContentBlock,
            height: LABEL_H, // first-in-column = no spacing
          });
          remaining -= LABEL_H;
          i++;
          continue;
        }
      }

      // Try splitting richtext at paragraph boundaries
      if (block.type === 'richtext') {
        const split = splitRichText(block.text, remaining);
        if (split) {
          const fitH = estimateTextHeight(split.fitText);
          left.push({ block: { type: 'richtext', text: split.fitText }, height: fitH });
          remaining -= fitH;

          // Switch to right column with overflow
          switched = true;
          remaining = availableHeight;
          const overH = estimateTextHeight(split.overflowText);
          right.push({ block: { type: 'richtext', text: split.overflowText }, height: overH });
          remaining -= overH;
        } else {
          // Nothing fits — move entire block to right
          switched = true;
          remaining = availableHeight;
          right.push({ block, height });
          remaining -= height;
        }
        i++;
        continue;
      }

      // Atomic block (table or label alone) — move to right column
      switched = true;
      remaining = availableHeight;
      if (block.type === 'label') {
        right.push({
          block: { ...block, isFirst: true },
          height: LABEL_H,
        });
        remaining -= LABEL_H;
      } else {
        right.push({ block, height });
        remaining -= height;
      }
      i++;
      continue;
    }

    // Already in right column — just push (overflow: hidden clips excess)
    right.push({ block, height });
    remaining -= height;
    i++;
  }

  // Check if content overflows either column
  const leftTotal = left.reduce((sum, mb) => sum + mb.height, 0);
  const rightTotal = right.reduce((sum, mb) => sum + mb.height, 0);
  const overflowed = leftTotal > availableHeight || rightTotal > availableHeight;

  return { left, right, overflowed };
}

/* ═══════════════ Overflow check for page 1 ═══════════════ */

/**
 * Returns true if page 1 body content overflows the available space.
 * Use this to warn the user in the editor before they download.
 */
export function checkPage1Overflow(data: BrochureData): boolean {
  const filledRows = data.accommodation.filter(
    (r) => r.floor?.trim() || (r.sqFt != null && r.sqFt !== 0),
  );
  const density = getTableDensity(filledRows.length);
  const heroSize = data.heroSize ?? 'landscape';
  const heroHeight = HERO_HEIGHTS[heroSize];
  const bodyHeight = BASE_BODY_HEIGHT - (heroHeight - HERO_HEIGHTS.landscape);
  const stream = buildContentStream(data, filledRows, density);
  const { overflowed } = allocateColumns(stream, bodyHeight);
  return overflowed;
}
