import { useState, useEffect } from 'react';
import { adminApi, type Template, type CompanyTemplate } from '../../lib/adminApi';

export default function TemplatesSection({ orgId }: { orgId: string }) {
  const [assigned, setAssigned] = useState<CompanyTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addTemplateId, setAddTemplateId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.listCompanyTemplates(orgId),
      adminApi.listTemplates(),
    ]).then(([assignedList, templatesList]) => {
      setAssigned(assignedList);
      setAllTemplates(templatesList);
    }).catch((err) => console.error('Failed to load templates:', err))
      .finally(() => setLoading(false));
  }, [orgId]);

  const availableTemplates = allTemplates
    .filter((t) => !assigned.some((a) => a.template_id === t.id));

  const handleAdd = async () => {
    if (!addTemplateId) return;
    setSaving(true);
    try {
      const row = await adminApi.assignCompanyTemplate({
        organization_id: orgId,
        template_id: addTemplateId,
        sort_order: assigned.length,
      });
      setAssigned((prev) => [...prev, row]);
      setAdding(false);
      setAddTemplateId('');
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await adminApi.removeCompanyTemplate(id);
      setAssigned((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div>
        <h4 className="text-xs font-medium text-gray-400 mb-2">Templates</h4>
        <div className="flex justify-center py-2">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-400 mb-2">Templates</h4>

      {assigned.length === 0 && !adding ? (
        <p className="text-xs text-gray-400 mb-2">No templates assigned.</p>
      ) : (
        <div className="space-y-1.5 mb-2">
          {assigned.map((t) => {
            const tpl = allTemplates.find((at) => at.id === t.template_id);
            return (
              <div key={t.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {tpl?.name ?? t.template_id}
                  </p>
                </div>
                <button
                  className="text-[10px] text-red-500 hover:text-red-700 font-medium uppercase px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors shrink-0"
                  onClick={() => handleRemove(t.id)}
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {adding ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Template</label>
            <select
              value={addTemplateId}
              onChange={(e) => setAddTemplateId(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="">Select...</option>
              {availableTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !addTemplateId}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
          <button
            onClick={() => { setAdding(false); setAddTemplateId(''); }}
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          disabled={availableTemplates.length === 0}
          className="text-xs text-amber-600 hover:text-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Template
        </button>
      )}
    </div>
  );
}
