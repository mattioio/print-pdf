import { useState, useEffect } from 'react';

interface MarkdownHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function MarkdownHelp({ open, onClose }: MarkdownHelpProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimating(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const id = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(id);
    }
  }, [open]);

  if (!open && !animating) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Scrim */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Formatting Guide</h2>
          <button
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <p className="text-sm text-gray-500">
            Text fields support simple formatting. Use these in any text area to style your PDF output.
          </p>

          <div className="space-y-4">
            <HelpRow syntax="*bold text*" description="Bold" preview="bold text" bold />
            <HelpRow syntax="- item one" description="Bullet list" preview="• item one" />
            <HelpRow syntax="Blank line" description="Paragraph break" preview="¶" />
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">You type</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-mono bg-white rounded-md border border-gray-200 p-3">{`*Misrepresentation Act:* Whilst every care is taken in the preparation of these particulars, the agents take no responsibility for any error.

- Measurements are approximate
- These particulars do not constitute an offer`}</pre>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PDF output</h3>
              <div className="text-sm text-gray-700 leading-relaxed bg-white rounded-md border border-gray-200 p-3">
                <p><span className="font-bold">Misrepresentation Act:</span> Whilst every care is taken in the preparation of these particulars, the agents take no responsibility for any error.</p>
                <div className="mt-2 space-y-0.5">
                  <p className="flex gap-1.5"><span className="text-gray-400">•</span> Measurements are approximate</p>
                  <p className="flex gap-1.5"><span className="text-gray-400">•</span> These particulars do not constitute an offer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpRow({ syntax, description, preview, bold }: { syntax: string; description: string; preview: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <code className="shrink-0 text-xs bg-gray-100 text-gray-700 rounded px-2 py-1 font-mono">
        {syntax}
      </code>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-500">{description}</span>
        <span className="text-sm text-gray-400 mx-1.5">→</span>
        <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{preview}</span>
      </div>
    </div>
  );
}
