import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { adminApi, type Template } from '../../lib/adminApi';
import { apiCompanySettings, apiCompanyAgents } from '../../lib/api';
import { settingsToClient } from '../../lib/convert';
import { createDefaultBrochureForOrg } from '../../utils/defaults';
import { templates } from '../pdf/templates';
import ActionButton from '../ActionButton';
import type { BrochureData } from '../../types/brochure';

export default function TemplatesTab({ onPreviewTemplate }: { onPreviewTemplate: (data: BrochureData) => void }) {
  const { organization } = useAuth();
  const { toast } = useToast();
  const [tpls, setTpls] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<'name' | 'description'>('name');
  const [editValue, setEditValue] = useState('');
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

  const handleSaveEdit = async (tpl: Template) => {
    if (!editValue.trim() || editValue.trim() === (editField === 'name' ? tpl.name : tpl.description)) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await adminApi.updateTemplate(tpl.id, { [editField]: editValue.trim() });
      setTpls((prev) => prev.map((t) => (t.id === tpl.id ? { ...t, ...updated } : t)));
    } catch {
      // silently fail
    }
    setEditingId(null);
  };

  const handleDelete = async (tpl: Template) => {
    if (tpl.usage_count > 0) return;
    try {
      await adminApi.deleteTemplate(tpl.id);
      setTpls((prev) => prev.filter((t) => t.id !== tpl.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleView = async (tpl: Template) => {
    if (!organization) return;
    try {
      const [settings, agents] = await Promise.all([
        apiCompanySettings.get(organization.id),
        apiCompanyAgents.list(organization.id),
      ]);
      const data = createDefaultBrochureForOrg(settingsToClient(settings, agents), tpl.id);
      data.name = `Preview: ${tpl.name}`;
      onPreviewTemplate(data);
    } catch (err) {
      console.error('Failed to preview template:', err);
      toast('Failed to preview template', 'error');
    }
  };

  const handleDuplicate = async (tpl: Template) => {
    try {
      const created = await adminApi.createTemplate(`${tpl.name} (copy)`, tpl.description);
      setTpls((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate template');
    }
  };

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
              const hasCode = !!templates[tpl.id];
              return (
                <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Name */}
                      {editingId === tpl.id && editField === 'name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tpl)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(tpl);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="w-full px-2 py-0.5 -ml-2 border border-amber-300 rounded text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      ) : (
                        <h3
                          className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors"
                          onClick={() => {
                            setEditingId(tpl.id);
                            setEditField('name');
                            setEditValue(tpl.name);
                          }}
                        >
                          {tpl.name}
                        </h3>
                      )}

                      {/* Description */}
                      {editingId === tpl.id && editField === 'description' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(tpl)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(tpl);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="w-full px-2 py-0.5 -ml-2 mt-1 border border-amber-300 rounded text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="Add a description..."
                        />
                      ) : (
                        <p
                          className="text-xs text-gray-400 mt-0.5 cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={() => {
                            setEditingId(tpl.id);
                            setEditField('description');
                            setEditValue(tpl.description);
                          }}
                        >
                          {tpl.description || 'Click to add description...'}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          hasCode
                            ? 'bg-green-50 text-green-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasCode ? 'bg-green-500' : 'bg-amber-500'}`} />
                          {hasCode ? 'Ready' : 'In Development'}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {tpl.usage_count} {tpl.usage_count === 1 ? 'company' : 'companies'}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          ID: {tpl.id}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <ActionButton
                        label="View"
                        hoverColor="hover:bg-amber-500"
                        onClick={() => handleView(tpl)}
                        disabled={!hasCode}
                        title={hasCode ? 'Preview in editor' : 'No code registered yet'}
                        icon={
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" />
                            <circle cx="8" cy="8" r="2" />
                          </svg>
                        }
                      />
                      <ActionButton
                        label="Duplicate"
                        onClick={() => handleDuplicate(tpl)}
                        title="Duplicate template"
                        icon={
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="5" y="5" width="9" height="9" rx="1.5" />
                            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
                          </svg>
                        }
                      />
                      <ActionButton
                        label="Delete"
                        hoverColor="hover:bg-red-600"
                        onClick={() => handleDelete(tpl)}
                        disabled={tpl.usage_count > 0}
                        title={tpl.usage_count > 0 ? `Assigned to ${tpl.usage_count} ${tpl.usage_count === 1 ? 'company' : 'companies'}` : 'Delete template'}
                        icon={
                          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                            <path d="M6.5 7v4M9.5 7v4" />
                          </svg>
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
