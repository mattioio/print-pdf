import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { adminApi, type Template } from '../../lib/adminApi';
import SlidePanel from './SlidePanel';

export default function TemplatesTab() {
  const { toast } = useToast();
  const [tpls, setTpls] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const list = await adminApi.listTemplates();
      setTpls(list);
    } catch (err) {
      console.error('Failed to load templates:', err);
      toast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setSaving(true);
    try {
      const created = await adminApi.createTemplate(newName.trim());
      setTpls((prev) => [...prev, created]);
      setNewName('');
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (tpl: Template) => {
    const newStatus = tpl.status === 'published' ? 'draft' : 'published';
    try {
      const updated = await adminApi.updateTemplate(tpl.id, { status: newStatus });
      setTpls((prev) => prev.map((t) => (t.id === tpl.id ? { ...t, ...updated } : t)));
    } catch {
      toast('Failed to update template status', 'error');
    }
  };

  const handleDelete = async (tpl: Template) => {
    if (tpl.usage_count > 0) return;
    try {
      await adminApi.deleteTemplate(tpl.id);
      setTpls((prev) => prev.filter((t) => t.id !== tpl.id));
      if (selectedId === tpl.id) setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleDuplicate = async (tpl: Template) => {
    try {
      const created = await adminApi.createTemplate(`${tpl.name} (copy)`, `${tpl.display_name} (copy)`, tpl.description);
      setTpls((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate template');
    }
  };

  const handleFieldUpdate = useCallback((id: string, updates: Partial<Template>) => {
    setTpls((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const selectedTpl = tpls.find((t) => t.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Template list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400">
            Templates ({tpls.length})
          </h2>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            New Template
          </button>
        </div>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        {/* Create form */}
        {creating && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Template Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Social Media Post"
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                className="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setNewName(''); setError(''); }}
                className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {tpls.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No templates yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {tpls.map((tpl) => {
              const isPublished = tpl.status === 'published';
              return (
                <div
                  key={tpl.id}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all group"
                  onClick={() => setSelectedId(tpl.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {tpl.name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                          isPublished
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-amber-500'}`} />
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      {tpl.display_name && tpl.display_name !== tpl.name && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{tpl.display_name}</p>
                      )}
                      {tpl.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{tpl.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 2v12l4-3 4 3V2H4z" />
                          </svg>
                          {tpl.usage_count} {tpl.usage_count === 1 ? 'company' : 'companies'}
                        </span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg
                      width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      className="text-gray-300 group-hover:text-gray-400 transition-colors shrink-0"
                    >
                      <polyline points="5 3 9 7 5 11" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Edit panel */}
      <SlidePanel
        open={!!selectedTpl}
        onClose={() => setSelectedId(null)}
        title={selectedTpl?.name ?? 'Template'}
      >
        {selectedTpl && (
          <TemplateEditForm
            key={selectedTpl.id}
            template={selectedTpl}
            onUpdate={handleFieldUpdate}
            onToggleStatus={() => handleToggleStatus(selectedTpl)}
            onDuplicate={() => handleDuplicate(selectedTpl)}
            onDelete={() => handleDelete(selectedTpl)}
          />
        )}
      </SlidePanel>
    </>
  );
}

/* ---- Template Edit Form (inside panel) ---- */

function TemplateEditForm({
  template,
  onUpdate,
  onToggleStatus,
  onDuplicate,
  onDelete,
}: {
  template: Template;
  onUpdate: (id: string, updates: Partial<Template>) => void;
  onToggleStatus: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(template.name);
  const [displayName, setDisplayName] = useState(template.display_name);
  const [description, setDescription] = useState(template.description);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadedRef = useRef(false);

  // Mark as loaded after initial mount
  useEffect(() => {
    loadedRef.current = true;
  }, []);

  // Auto-save (debounced 500ms)
  useEffect(() => {
    if (!loadedRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const updated = await adminApi.updateTemplate(template.id, {
          name: name.trim() || template.name,
          display_name: displayName.trim(),
          description: description.trim(),
        });
        onUpdate(template.id, updated);
      } catch {
        toast("Couldn't save changes", 'error');
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [name, displayName, description]);

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none';

  const isPublished = template.status === 'published';

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Internal Name</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
        <input
          className={inputClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Shown to users"
        />
        <p className="text-[10px] text-gray-400 mt-1">The name users see when selecting this template.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
        <textarea
          className={inputClass + ' resize-y'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this template..."
          rows={3}
        />
      </div>

      {/* Status info */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">Info</label>
        <div className="space-y-1.5 text-xs text-gray-400">
          <p>Status: <span className={isPublished ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{isPublished ? 'Published' : 'Draft'}</span></p>
          <p>Used by {template.usage_count} {template.usage_count === 1 ? 'company' : 'companies'}</p>
          <p className="font-mono text-[10px] text-gray-300">ID: {template.id}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">Actions</label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors ${
              isPublished
                ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
            }`}
            onClick={onToggleStatus}
          >
            {isPublished ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" />
                <circle cx="8" cy="8" r="2" />
                <path d="M2 14L14 2" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" />
                <circle cx="8" cy="8" r="2" />
              </svg>
            )}
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
            onClick={onDuplicate}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="5" width="9" height="9" rx="1.5" />
              <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
            </svg>
            Duplicate
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:text-gray-500 disabled:hover:border-gray-200"
            onClick={onDelete}
            disabled={template.usage_count > 0}
            title={template.usage_count > 0 ? `Assigned to ${template.usage_count} ${template.usage_count === 1 ? 'company' : 'companies'}` : 'Delete template'}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
              <path d="M6.5 7v4M9.5 7v4" />
            </svg>
            Delete
          </button>
        </div>
      </div>

      <p className="text-[10px] text-gray-300 pt-1">
        Changes are saved automatically.
      </p>
    </div>
  );
}
