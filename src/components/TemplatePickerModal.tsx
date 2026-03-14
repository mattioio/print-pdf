import { templates } from './pdf/templates';
import Modal from './Modal';
import type { CompanyTemplate } from '../lib/adminApi';

export default function TemplatePickerModal({
  companyTemplates,
  onSelect,
  onClose,
}: {
  companyTemplates: CompanyTemplate[];
  onSelect: (templateId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose}>
      <div className="p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Choose a template</h3>
        <p className="text-sm text-gray-500 mb-5">Select a template for your new brochure.</p>
        <div className="flex flex-col gap-2">
          {companyTemplates.map((ct) => {
            const tpl = templates[ct.template_id];
            return (
              <button
                key={ct.id}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors group"
                onClick={() => onSelect(ct.template_id)}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber-500">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">{ct.display_name}</div>
                  {tpl && (
                    <div className="text-xs text-gray-400 truncate">{tpl.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <button
          className="w-full mt-4 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
