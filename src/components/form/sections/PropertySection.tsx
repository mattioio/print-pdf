import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useBrochure } from '../../../context/BrochureContext';
import { parseCoordsFromUrl, resolveAndParseCoords, generateStaticMap } from '../../../utils/maps';
import ImageUploader from '../ImageUploader';
import { Section, SectionHeading, Label, Input, TextArea, ToggleSwitch } from '../primitives';
import type { GalleryImage } from '../../../types/brochure';

export default function PropertySection() {
  const { data, updateField } = useBrochure();
  const [mapLoading, setMapLoading] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [showMapOverride, setShowMapOverride] = useState(() => !!data.mapUrl);
  const mapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const addressMapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const generateMapFromAddress = useCallback(
    async (address: string) => {
      if (address.length < 5) return;
      setMapLoading(true);
      setMapFailed(false);
      try {
        const coords = await resolveAndParseCoords(null, address);
        if (!coords) {
          setMapFailed(true);
          setShowMapOverride(true);
          setMapLoading(false);
          return;
        }
        const dataUrl = await generateStaticMap(coords.lat, coords.lng);
        updateField('mapImageUrl', dataUrl);
        setMapFailed(false);
      } catch {
        setMapFailed(true);
        setShowMapOverride(true);
      } finally {
        setMapLoading(false);
      }
    },
    [updateField]
  );

  // Auto-geocode map from property address (debounced 1s)
  const prevAddress = useRef(data.propertyAddress);
  useEffect(() => {
    if (prevAddress.current === data.propertyAddress) return;
    prevAddress.current = data.propertyAddress;
    if (data.mapUrl?.trim()) return;
    clearTimeout(addressMapTimer.current);
    if (!data.propertyAddress?.trim()) {
      updateField('mapImageUrl', '');
      setMapFailed(false);
      return;
    }
    addressMapTimer.current = setTimeout(() => {
      generateMapFromAddress(data.propertyAddress);
    }, 1000);
  }, [data.propertyAddress, data.mapUrl, generateMapFromAddress, updateField]);

  const handleMapUrl = useCallback(
    (url: string) => {
      updateField('mapUrl', url);
      clearTimeout(mapTimer.current);
      if (!url.trim()) {
        if (data.propertyAddress?.trim()) {
          clearTimeout(addressMapTimer.current);
          addressMapTimer.current = setTimeout(() => {
            generateMapFromAddress(data.propertyAddress);
          }, 600);
        } else {
          updateField('mapImageUrl', '');
        }
        return;
      }
      mapTimer.current = setTimeout(async () => {
        setMapLoading(true);
        try {
          const coords =
            parseCoordsFromUrl(url) ??
            await resolveAndParseCoords(url) ??
            (data.propertyAddress ? await resolveAndParseCoords(null, data.propertyAddress) : null);
          if (!coords) { setMapLoading(false); return; }
          const dataUrl = await generateStaticMap(coords.lat, coords.lng);
          updateField('mapImageUrl', dataUrl);
          setMapFailed(false);
        } catch {
          // silently fail
        } finally {
          setMapLoading(false);
        }
      }, 600);
    },
    [updateField, data.propertyAddress, generateMapFromAddress]
  );

  useEffect(() => () => {
    clearTimeout(mapTimer.current);
    clearTimeout(addressMapTimer.current);
  }, []);

  const gallery = (data.galleryImages ?? []).filter((img) => img.url);
  const MAX_GALLERY = 3;

  const addGalleryImage = useCallback(
    (dataUrl: string) => {
      if (gallery.length >= MAX_GALLERY) return;
      const img: GalleryImage = { id: uuid(), url: dataUrl, position: { x: 50, y: 50 } };
      updateField('galleryImages', [...gallery, img]);
    },
    [gallery, updateField]
  );

  const updateGalleryImage = useCallback(
    (id: string, url: string) => {
      updateField(
        'galleryImages',
        gallery.map((img) => (img.id === id ? { ...img, url } : img))
      );
    },
    [gallery, updateField]
  );

  const updateGalleryPosition = useCallback(
    (id: string, position: { x: number; y: number }) => {
      updateField(
        'galleryImages',
        gallery.map((img) => (img.id === id ? { ...img, position } : img))
      );
    },
    [gallery, updateField]
  );

  const removeGalleryImage = useCallback(
    (id: string) => {
      updateField(
        'galleryImages',
        gallery.filter((img) => img.id !== id)
      );
    },
    [gallery, updateField]
  );

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const galleryContainerRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state
  useEffect(() => { isDraggingRef.current = dragIdx !== null; }, [dragIdx]);

  // No capture-phase needed — we use an overlay approach instead

  const reorderGallery = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const next = [...gallery];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      updateField('galleryImages', next);
    },
    [gallery, updateField]
  );

  return (
    <>
      {/* Images */}
      <SectionHeading>Images</SectionHeading>
      <Section>
        {/* Hero size segmented control + recommended dimensions */}
        <div data-section="hero-size">
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            {([
              { value: 'landscape', label: 'Landscape', h: 736 },
              { value: 'tall', label: 'Tall', h: 1000 },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                  (data.heroSize ?? 'landscape') === opt.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => updateField('heroSize', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1">
            Recommended: 1190 × {(data.heroSize ?? 'landscape') === 'tall' ? '1000' : '736'}px
          </p>
        </div>

        <ImageUploader
          value={data.heroImageUrl}
          onChange={(v) => updateField('heroImageUrl', v)}
          label="Upload property photo"
          aspectRatio={(data.heroSize ?? 'landscape') === 'tall' ? 595 / 500 : 595 / 368}
          height="160px"
          position={data.heroImagePosition}
          onPositionChange={(pos) => updateField('heroImagePosition', pos)}
          zoom={data.heroZoom ?? 100}
        />

        {/* Zoom slider — thick track with icons inset, iOS style */}
        {data.heroImageUrl && (
          <div className="relative flex items-center h-7 rounded-full bg-gray-100 px-2.5 -mt-1">
            {/* Zoom-out icon (left) */}
            <svg className="w-3 h-3 text-gray-400 shrink-0 pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
              <line x1="5" y1="7" x2="9" y2="7" />
            </svg>
            <input
              type="range"
              min={100}
              max={125}
              step={1}
              value={data.heroZoom ?? 100}
              onChange={(e) => updateField('heroZoom', Number(e.target.value))}
              className="zoom-slider flex-1 mx-2"
            />
            {/* Zoom-in icon (right) */}
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="5" />
              <line x1="10.5" y1="10.5" x2="14" y2="14" />
              <line x1="5" y1="7" x2="9" y2="7" />
              <line x1="7" y1="5" x2="7" y2="9" />
            </svg>
          </div>
        )}

        {/* Gallery toggle + slots */}
        <div className="mt-1">
          <ToggleSwitch
            checked={!!data.showGallery}
            onChange={(v) => updateField('showGallery', v)}
            label="Photo gallery"
          >
            {data.showGallery && gallery.length > 0 && (
              <span className="text-xs text-gray-400 ml-auto">{gallery.length}/{MAX_GALLERY}</span>
            )}
          </ToggleSwitch>
          {data.showGallery && (
            <div className="flex gap-2 mt-2.5" ref={galleryContainerRef}>
              {gallery.map((img, i) => (
                <div
                  key={img.id}
                  className={`relative flex-1 min-w-0 transition-opacity ${dragIdx !== null && dragIdx !== i && dragOverIdx === i ? 'ring-2 ring-amber-400 rounded-lg' : ''} ${dragIdx === i ? 'opacity-40' : ''}`}
                >
                  <ImageUploader
                    value={img.url}
                    onChange={(v) => {
                      if (v) updateGalleryImage(img.id, v);
                      else removeGalleryImage(img.id);
                    }}
                    label="+"
                    height="80px"
                    compact
                    position={img.position}
                    onPositionChange={(pos) => updateGalleryPosition(img.id, pos)}
                  />
                  {/* Drag overlay — sits above ImageUploader during drag to intercept all events */}
                  {dragIdx !== null && dragIdx !== i && (
                    <div
                      className="absolute inset-0 z-10"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverIdx(i);
                      }}
                      onDragLeave={() => setDragOverIdx(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        reorderGallery(dragIdx, i);
                        setDragIdx(null);
                        setDragOverIdx(null);
                      }}
                    />
                  )}
                  {/* Drag handle */}
                  {gallery.length >= 2 && (
                    <div
                      className="flex justify-center mt-1 cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => {
                        setDragIdx(i);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    >
                      <svg width="16" height="6" viewBox="0 0 16 6" className="text-gray-300">
                        <circle cx="4" cy="1" r="1" fill="currentColor" />
                        <circle cx="8" cy="1" r="1" fill="currentColor" />
                        <circle cx="12" cy="1" r="1" fill="currentColor" />
                        <circle cx="4" cy="5" r="1" fill="currentColor" />
                        <circle cx="8" cy="5" r="1" fill="currentColor" />
                        <circle cx="12" cy="5" r="1" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              {gallery.length < MAX_GALLERY && (
                <div className={gallery.length > 0 ? 'flex-1 min-w-0' : 'w-20'}>
                  <ImageUploader
                    value=""
                    onChange={addGalleryImage}
                    label="+"
                    height="80px"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Property Info */}
      <SectionHeading>Property</SectionHeading>
      <Section>
        <div>
          <Label>Headline</Label>
          <Input
            value={data.headline}
            onChange={(v) => updateField('headline', v)}
            placeholder="e.g. ICONIC NIGHTCLUB TO LET"
          />
        </div>
        <div>
          <Label>Location Name</Label>
          <Input
            value={data.locationName}
            onChange={(v) => updateField('locationName', v)}
            placeholder="e.g. BRIXTON"
          />
        </div>
        <div>
          <Label>Property Address</Label>
          <Input
            value={data.propertyAddress}
            onChange={(v) => updateField('propertyAddress', v)}
            placeholder="e.g. 467-469 Brixton Road, London SW9 8HH"
          />
        </div>
        {/* Location Map */}
        <div>
          {mapLoading && (
            <p className="text-xs text-amber-500 mt-1">Generating map...</p>
          )}
          {data.mapImageUrl && !mapLoading && (
            <div className="rounded-md overflow-hidden border border-gray-200">
              <img src={data.mapImageUrl} alt="Location map" className="w-full h-auto" />
            </div>
          )}
          {mapFailed && !mapLoading && !data.mapImageUrl && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 mt-1">
              <p className="text-xs text-amber-700">
                <span className="font-medium">Couldn't locate this address.</span>{' '}
                Paste a Google Maps link below to set the map location.
              </p>
            </div>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium mt-2 transition-colors"
            onClick={() => setShowMapOverride((v) => !v)}
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {showMapOverride ? <path d="M2 4l4 4 4-4" /> : <path d="M4 2l4 4-4 4" />}
            </svg>
            {mapFailed && !data.mapImageUrl ? 'Add Google Maps link' : 'Override map location'}
          </button>
          {showMapOverride && (
            <div className="mt-1">
              <Input
                value={data.mapUrl ?? ''}
                onChange={handleMapUrl}
                placeholder="Paste a Google Maps link..."
              />
              {data.mapUrl && !data.mapImageUrl && !mapLoading && (
                <p className="text-xs text-gray-400 mt-1">
                  Couldn't extract coordinates. Try clicking the place on Google Maps, then copy the URL from the address bar.
                </p>
              )}
            </div>
          )}
        </div>
        <div>
          <Label>Location Description</Label>
          <TextArea
            value={data.locationDescription}
            onChange={(v) => updateField('locationDescription', v)}
            placeholder="e.g. The property is prominently situated on the west side of Brixton Road..."
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
        {/* Premises Licence toggle */}
        <div>
          <Label>Premises Licence</Label>
          <ToggleSwitch
            checked={!!data.premisesLicence}
            onChange={(v) => {
              if (v) {
                updateField('premisesLicence', 'The premises benefits from a 24 hour licence');
              } else {
                updateField('premisesLicence', '');
              }
            }}
          >
            <span className="text-sm text-gray-500">{data.premisesLicence ? 'Enabled' : 'None'}</span>
          </ToggleSwitch>
          {!!data.premisesLicence && (
            <div className="mt-2">
              <Input
                value={data.premisesLicence}
                onChange={(v) => updateField('premisesLicence', v)}
                placeholder="e.g. The premises benefits from a 24 hour licence"
              />
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
