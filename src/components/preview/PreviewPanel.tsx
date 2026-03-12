import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import { useBrochure } from '../../context/BrochureContext';
import { templates } from '../pdf/templates';
import { loadAgencySettings } from '../../utils/agency';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

interface PreviewPanelProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function PreviewPanel({ sidebarCollapsed, onToggleSidebar }: PreviewPanelProps) {
  const { data } = useBrochure();
  const template = templates[data.templateId] ?? templates.classic;
  const TemplateComponent = template.component;

  // Always use live agency settings (logo, contact info, fonts, accent) — not per-brochure snapshots
  const liveData = useMemo(() => {
    const settings = loadAgencySettings();
    return {
      ...data,
      agency: settings.agency,
      accentColor: settings.accentColor,
      titleFont: settings.titleFont,
      bodyFont: settings.bodyFont,
    };
  }, [data]);

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

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  // A4 at 100% = ~595pt (A4 width in points). Scale based on zoom.
  const pageWidth = Math.round(595 * (zoom / 100));

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

      {/* PDF Preview */}
      <div className="flex-1 overflow-auto p-6">
        {instance.error && (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">
            Error generating PDF: {String(instance.error)}
          </div>
        )}
        {instance.url && (
          <Document
            file={instance.url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-20 text-gray-400">
                Rendering preview...
              </div>
            }
          >
            <div className="flex flex-col items-center gap-6">
              {Array.from({ length: numPages }, (_, i) => (
                <div key={i} className="shadow-lg">
                  <Page
                    pageNumber={i + 1}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))}
            </div>
          </Document>
        )}
        {!instance.url && !instance.error && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Generating PDF...
          </div>
        )}
      </div>
    </div>
  );
}
