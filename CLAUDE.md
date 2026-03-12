# Print PDF — Property Brochure Builder

## What this is

A commercial property PDF brochure builder for **Jenkins Law** (commercial property agents). Built with Vite + React + TypeScript + @react-pdf/renderer + Tailwind CSS v4. All data stored client-side (localStorage + IndexedDB for images).

## Architecture

- **Dashboard** (`src/pages/Dashboard.tsx`) — Lists saved brochures with hero thumbnails, Edit/Duplicate/Delete actions. Sticky header with agency name + Settings button. "New Brochure" CTA in page body.
- **Editor** (`src/pages/Editor.tsx`) — Split-pane: form sidebar (420px) + live PDF preview. Top bar has Back, title, Settings gear.
- **Settings** (`src/pages/Settings.tsx`) — Slide-over drawer (right, full height, scrim). Agency details, logo, agents, branding (accent colour, fonts). Auto-saves.
- **PDF Templates** (`src/components/pdf/templates/`) — Classic template with hero image (595×368 golden ratio), schedule table, map, contacts, disclaimer. Uses @react-pdf/renderer.
- **Form Sections** — PropertySection, AccommodationSection (with schedule cards), UseSection (planning class chips + STPP toggle), Page2Section, ViewingsSection.
- **Context** (`src/context/BrochureContext.tsx`) — BrochureProvider with undo/redo support.
- **Storage** — `src/utils/storage.ts` (localStorage for brochure data), `src/utils/imageStore.ts` (IndexedDB for images).

## Key patterns

- Agency settings are global (not per-brochure) — loaded from localStorage via `loadAgencySettings()`
- Images stored in IndexedDB, keyed as `{brochureId}:{fieldName}`
- PDF preview debounced at 400ms via `usePDF` + `setTimeout`
- Form primitives in `src/components/form/primitives.tsx` (Section, SectionHeading, Label, Input, Textarea, NumberInput)
- Custom toggle switches use CSS `peer` / `peer-checked` pattern
- Settings drawer uses double `requestAnimationFrame` for animation triggering

## Dev server

```bash
npm run dev  # Vite on port 5173
```

## Recent work

- Dashboard redesigned as app-like UI with sticky header, company name brand, "My brochures" section
- Settings moved from route to slide-over drawer, accessible from both Dashboard and Editor
- Smart Use section with UK planning class chips (Sui Generis, E, B2, B8, etc.) and STPP toggle
- Hero image aspect ratio matches golden ratio (595:368), capped at 160px in sidebar
- Removed PDF divider lines and schedule table headers
- Premises Licence as toggle switch with its own card
- Undo/redo in editor context
- Bidirectional sq ft / sq m conversion in schedule cards
