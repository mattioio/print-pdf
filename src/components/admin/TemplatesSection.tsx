import { useState, useEffect } from 'react';
import { adminApi, type Template, type CompanyTemplate } from '../../lib/adminApi';

export default function TemplatesSection({ orgId }: { orgId: string }) {
  const [assigned, setAssigned] = useState<CompanyTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addTemplateId, setAddTemplateId] = useState('');
  const [addDisplayName, setAddDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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
    if (!addTemplateId || !addDisplayName.trim()) return;
    setSaving(true);
    try {
      const row = await adminApi.assignCompanyTemplate({
        organization_id: orgId,
        template_id: addTemplateId,
        display_name: addDisplayName.trim(),
        sort_order: assigned.length,
      });
      setAssigned((prev) => [...prev, row]);
      setAdding(false);
      setAddTemplateId('');
      setAddDisplayName('');
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDisplayName = async (row: CompanyTemplate) => {
    if (!editName.trim() || editName.trim() === row.display_name) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await adminApi.updateCompanyTemplate(row.id, editName.trim());
      setAssigned((prev) => prev.map((t) => (t.id === row.id ? updated : t)));
    } catch {
      // silently fail
    }
    setEditingId(null);
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
          {assigned.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {allTemplates.find((at) => at.id === t.template_id)?.name ?? t.template_id}
                </p>
                {editingId === t.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSaveDisplayName(t)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDisplayName(t);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="w-full px-1.5 py-0.5 border border-amber-300 rounded text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                ) : (
                  <p className="text-xs text-gray-400">
                    Users see: <span className="text-gray-600">{t.display_name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  className="text-[10px] text-gray-400 hover:text-gray-600 font-medium uppercase px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setEditingId(t.id);
                    setEditName(t.display_name);
                  }}
                >
                  Edit
                </button>
                <button
                  className="text-[10px] text-red-500 hover:text-red-700 font-medium uppercase px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                  onClick={() => handleRemove(t.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="flex gap-2 items-end">
          <div className="w-36">
            <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Template</label>
            <select
              value={addTemplateId}
              onChange={(e) => {
                setAddTemplateId(e.target.value);
                const tpl = allTemplates.find((t) => t.id === e.target.value);
                if (tpl) setAddDisplayName(tpl.name);
              }}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              <option value="">Select...</option>
              {availableTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Display Name (what users see)</label>
            <input
              type="text"
              value={addDisplayName}
              onChange={(e) => setAddDisplayName(e.target.value)}
              placeholder="e.g. Brochure"
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !addTemplateId || !addDisplayName.trim()}
            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
          <button
            onClick={() => { setAdding(false); setAddTemplateId(''); setAddDisplayName(''); }}
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
