import { useState, useEffect, useRef, useCallback } from 'react';
import { useBrochure } from '../../../context/BrochureContext';
import { parseCoordsFromUrl, resolveAndParseCoords, generateStaticMap } from '../../../utils/maps';
import ImageUploader from '../ImageUploader';
import { Section, SectionHeading, Label, Input } from '../primitives';

export default function PropertySection() {
  const { data, updateField } = useBrochure();
  const [mapLoading, setMapLoading] = useState(false);
  const [showMapOverride, setShowMapOverride] = useState(() => !!data.mapUrl);
  const mapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const addressMapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const generateMapFromAddress = useCallback(
    async (address: string) => {
      if (address.length < 5) return;
      setMapLoading(true);
      try {
        const coords = await resolveAndParseCoords(null, address);
        if (!coords) { setMapLoading(false); return; }
        const dataUrl = await generateStaticMap(coords.lat, coords.lng);
        updateField('mapImageUrl', dataUrl);
      } catch {
        // silently fail
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

  return (
    <>
      {/* Location Photo */}
      <Section>
        <Label>Location Photo</Label>
        <ImageUploader
          value={data.heroImageUrl}
          onChange={(v) => updateField('heroImageUrl', v)}
          label="Upload property photo"
          aspectRatio={595 / 368}
          height="160px"
          position={data.heroImagePosition}
          onPositionChange={(pos) => updateField('heroImagePosition', pos)}
        />
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
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium mt-2 transition-colors"
            onClick={() => setShowMapOverride((v) => !v)}
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {showMapOverride ? <path d="M2 4l4 4 4-4" /> : <path d="M4 2l4 4-4 4" />}
            </svg>
            Override map location
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
      </Section>
    </>
  );
}
