import { useState } from 'react';
import FormPanel from '../components/form/FormPanel';
import PreviewPanel from '../components/preview/PreviewPanel';

interface EditorProps {
  onBack: () => void;
  onSettings: () => void;
}

export default function Editor({ onBack, onSettings }: EditorProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-4 py-2 bg-white border-b border-gray-200 gap-3">
        <button
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          onClick={onBack}
        >
          &larr; Back
        </button>
        <span className="text-sm font-semibold text-gray-800">
          Property Brochure Builder
        </span>
        <div className="flex-1" />
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          onClick={onSettings}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.7 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.7a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Split panel */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className="border-r border-gray-200 bg-white overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: collapsed ? 0 : 420, minWidth: collapsed ? 0 : 360, borderRightWidth: collapsed ? 0 : 1 }}
        >
          <FormPanel />
        </div>
        <div className="flex-1 overflow-hidden">
          <PreviewPanel
            sidebarCollapsed={collapsed}
            onToggleSidebar={() => setCollapsed((c) => !c)}
          />
        </div>
      </div>
    </div>
  );
}
