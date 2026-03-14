import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import { useBrochure } from '../../context/BrochureContext';
import { useAuth } from '../../context/AuthContext';
import { templates } from '../pdf/templates';
import { apiCompanySettings, apiCompanyAgents } from '../../lib/api';
import { settingsToClient, type ClientCompanySettings } from '../../lib/convert';
import { checkPage1Overflow } from '../pdf/shared/columnFlow';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

interface PreviewPanelProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  settingsRevision: number;
}

export default function PreviewPanel({ sidebarCollapsed, onToggleSidebar, settingsRevision }: PreviewPanelProps) {
  const { data } = useBrochure();
  const { organization } = useAuth();
  const template = templates[data.templateId] ?? templates.classic;
  const TemplateComponent = template.pdfComponent;

  // Load live company settings from API (refreshes when settingsRevision changes)
  const [companySettings, setCompanySettings] = useState<ClientCompanySettings | null>(null);
  const orgId = organization?.id ?? '';

  // Reset when org changes
  useEffect(() => { setCompanySettings(null); }, [orgId]);

  useEffect(() => {
    if (!orgId) return;
    Promise.all([
      apiCompanySettings.get(orgId),
      apiCompanyAgents.list(orgId),
    ]).then(([s, a]) => setCompanySettings(settingsToClient(s, a)))
      .catch(() => { /* use brochure defaults */ });
  }, [orgId, settingsRevision]);

  // Merge live company settings over brochure data
  const liveData = useMemo(() => {
    if (!companySettings) return data;
    return {
      ...data,
      agency: companySettings.agency,
      accentColor: companySettings.accentColor,
      textColor: companySettings.textColor,
      titleFont: companySettings.titleFont,
      bodyFont: companySettings.bodyFont,
    };
  }, [data, companySettings]);

  const overflowed = useMemo(() => checkPage1Overflow(liveData), [liveData]);

  const document = useMemo(() => <TemplateComponent data={liveData} />, [liveData]);
  const [instance, update] = usePDF({ document });

  // Debounce PDF updates
  const updateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedDoc, setDebouncedDoc] = useState(document);

  useEffect(() => {
    clearTimeout(updateTimer.current);
    updateTimer.current = setTimeout(() => {
      setDebouncedDoc(document);
    }, 400);
    return () => clearTimeout(updateTimer.current);
  }, [document]);

  useEffect(() => {
    update(debouncedDoc);
  }, [debouncedDoc, update]);

  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);
  const prevUrl = useRef(instance.url);
  const reloading = useRef(false);

  // Dim as soon as a debounced update starts PDF regeneration
  useEffect(() => {
    setBusy(true);
    update(debouncedDoc);
  }, [debouncedDoc, update]);

  // When the PDF blob URL changes, lock content height to prevent scroll collapse.
  // Runs during render (before DOM update) so we capture the old height.
  if (instance.url && instance.url !== prevUrl.current) {
    prevUrl.current = instance.url;
    reloading.current = true;
    if (contentRef.current) {
      contentRef.current.style.minHeight = `${contentRef.current.offsetHeight}px`;
    }
  }

  const handleScroll = useCallback(() => {
    if (scrollRef.current && !reloading.current) {
      savedScroll.current = scrollRef.current.scrollTop;
    }
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    requestAnimationFrame(() => {
      if (contentRef.current) contentRef.current.style.minHeight = '';
      if (scrollRef.current) scrollRef.current.scrollTop = savedScroll.current;
      reloading.current = false;
      setBusy(false);
    });
  }, []);

  // A4 dimensions scaled to zoom level
  const pageWidth = Math.round(595 * (zoom / 100));
  const pageHeight = Math.round(pageWidth * 1.4142);

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((s) => s > zoom);
    if (next) setZoom(next);
  };

  const zoomOut = () => {
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < zoom);
    if (prev) setZoom(prev);
  };

  const handleDownload = () => {
    if (!instance.url) return;
    const link = window.document.createElement('a');
    link.href = instance.url;
    link.download = `${liveData.name || 'brochure'}.pdf`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 h-10 bg-white border-b border-gray-200">
        {/* Toggle sidebar */}
        <button
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Show editor' : 'Hide editor'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="2" width="14" height="12" rx="1.5" />
            <line x1="6" y1="2" x2="6" y2="14" />
            {sidebarCollapsed ? (
              <polyline points="9,6 11,8 9,10" />
            ) : (
              <polyline points="11,6 9,8 11,10" />
            )}
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-200" />

        {/* Zoom controls */}
        <button
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_STEPS[0]}
          title="Zoom out"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="7" x2="11" y2="7" />
          </svg>
        </button>
        <span className="text-xs text-gray-500 w-10 text-center select-none tabular-nums">{zoom}%</span>
        <button
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          title="Zoom in"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="7" x2="11" y2="7" />
            <line x1="7" y1="3" x2="7" y2="11" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* Status */}
        {instance.loading && (
          <span className="text-xs text-gray-400">Generating...</span>
        )}

        {/* Download */}
        <button
          className="px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleDownload}
          disabled={instance.loading || !instance.url}
        >
          Download PDF
        </button>

      </div>

      {/* Overflow warning */}
      {overflowed && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-100">
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l7 14H1L8 1zm0 4.5v4m0 2v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
          <span className="text-xs text-amber-700">
            Page 1 content is being clipped — try shortening descriptions{liveData.heroSize === 'tall' ? ' or switching to Landscape' : ''}.
          </span>
        </div>
      )}

      {/* Missing map warning */}
      {liveData.propertyAddress?.trim() && !liveData.mapImageUrl && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-100">
          <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="6.5" r="2.5" />
            <path d="M8 1C5.2 1 3 3.2 3 6c0 3.5 5 9 5 9s5-5.5 5-9c0-2.8-2.2-5-5-5z" />
          </svg>
          <span className="text-xs text-amber-700">
            No map found for this address — paste a Google Maps link in the Property section.
          </span>
        </div>
      )}

      {/* PDF Preview */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-6"
        style={{
          background: 'linear-gradient(rgba(51,51,51,0.85), rgba(51,51,51,0.85)), url(/images/diagonal.svg) 0 0 / 128px 128px',
        }}
      >
        {instance.error && (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">
            Error generating PDF: {String(instance.error)}
          </div>
        )}
        {/* Content wrapper: locks minHeight during reload to prevent scroll collapse,
            dims while the PDF regenerates, and uses size-matched placeholders to
            avoid layout shift when react-pdf swaps out page canvases. */}
        <div
          ref={contentRef}
          className="transition-opacity duration-150"
          style={{ opacity: busy ? 0.5 : 1 }}
        >
          {instance.url && (
            <Document
              file={instance.url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center gap-6">
                  {Array.from({ length: numPages || 1 }, (_, i) => (
                    <div key={i} className="shadow-lg bg-white" style={{ width: pageWidth, height: pageHeight }} />
                  ))}
                </div>
              }
            >
              <div className="flex flex-col items-center gap-6">
                {Array.from({ length: numPages }, (_, i) => (
                  <div key={i} className="shadow-lg bg-white">
                    <Page
                      pageNumber={i + 1}
                      width={pageWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      canvasBackground="white"
                    />
                  </div>
                ))}
              </div>
            </Document>
          )}
        </div>
        {!instance.url && !instance.error && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Generating PDF...
          </div>
        )}
      </div>
    </div>
  );
}
