import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi, type Company, type Member, type Invitation, type Template, type CompanyTemplate } from '../lib/adminApi';
import { apiCompanySettings, apiCompanyAgents } from '../lib/api';
import { settingsToClient } from '../lib/convert';
import { createDefaultBrochureForOrg } from '../utils/defaults';
import { templates } from '../components/pdf/templates';
import type { BrochureData } from '../types/brochure';

type AdminTab = 'companies' | 'templates';

interface AdminProps {
  onBack: () => void;
  onPreviewTemplate: (data: BrochureData) => void;
}

export default function Admin({ onBack, onPreviewTemplate }: AdminProps) {
  const [tab, setTab] = useState<AdminTab>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await adminApi.listCompanies();
      setCompanies(list);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center h-14 px-6">
          <button
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            onClick={onBack}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 2 3 7 8 12" />
            </svg>
            Dashboard
          </button>
          <div className="flex-1" />
          <h1 className="text-sm font-semibold text-gray-900">Admin Panel</h1>
          <div className="flex-1" />
          <div className="w-20" />
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-6 flex gap-6">
          {(['companies', 'templates'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-amber-500 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-8">
        {tab === 'companies' ? (
          <>
            {/* Create Company */}
            <CreateCompanyForm onCreated={reload} />

            {/* Companies List */}
            <section>
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                Companies ({companies.length})
              </h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : companies.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No companies yet.</p>
              ) : (
                <div className="space-y-2">
                  {companies.map((c) => (
                    <CompanyCard
                      key={c.id}
                      company={c}
                      expanded={expandedOrg === c.id}
                      onToggle={() => setExpandedOrg(expandedOrg === c.id ? null : c.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <TemplatesTab onPreviewTemplate={onPreviewTemplate} />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Company Form                                                */
/* ------------------------------------------------------------------ */

function CreateCompanyForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    try {
      await adminApi.createCompany(name.trim());
      setName('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-sm font-medium text-gray-400 mb-3">Create Company</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Property"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </form>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Company Card                                                       */
/* ------------------------------------------------------------------ */

function CompanyCard({
  company,
  expanded,
  onToggle,
}: {
  company: Company;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{company.agency_name || company.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {company.template_count} template{company.template_count !== 1 ? 's' : ''}
            {' \u00b7 '}
            {company.member_count} {company.member_count === 1 ? 'person' : 'people'}
            {' \u00b7 '}
            {new Date(company.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="3 5 7 9 11 5" />
        </svg>
      </button>

      {expanded && <CompanyDetail orgId={company.id} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Company Detail (members + invites)                                 */
/* ------------------------------------------------------------------ */

function CompanyDetail({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await adminApi.getCompanyMembers(orgId);
      setMembers(data.members);
      setInvitations(data.invitations);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setError('');
    setInviting(true);
    try {
      const invite = await adminApi.inviteUser(orgId, inviteEmail.trim(), inviteName.trim() || undefined);
      setInviteEmail('');
      setInviteName('');
      setInvitations((prev) => [invite, ...prev]);
      // Copy invite link to clipboard
      const link = `${window.location.origin}?invite=${invite.code}`;
      await navigator.clipboard.writeText(link);
      setCopiedCode(invite.code);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setInviting(false);
    }
  };

  const copyLink = async (code: string) => {
    const link = `${window.location.origin}?invite=${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading) {
    return (
      <div className="px-5 pb-4 flex justify-center">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingInvites = invitations.filter((inv) => !inv.used_at);

  return (
    <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-4">
      {/* People — members + pending invites + invite form */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-400">People</h4>
        </div>

        <div className="space-y-1.5">
          {/* Active members */}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-1">
              {m.image ? (
                <img src={m.image} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-400">
                  {m.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                <p className="text-xs text-gray-400 truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  className="text-[10px] text-gray-400 hover:text-amber-600 font-medium px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
                  onClick={() => setResetTarget(m)}
                  title="Reset password"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </button>
                <button
                  className="text-[10px] text-gray-400 hover:text-red-600 font-medium px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                  onClick={() => setDeleteTarget(m)}
                  title="Remove from company"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Pending invites — shown inline with members */}
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 py-1">
              <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 truncate">
                  {inv.name || inv.email}
                </p>
                {inv.name && (
                  <p className="text-xs text-gray-300 truncate">{inv.email}</p>
                )}
              </div>
              <button
                className="text-[10px] text-amber-600 hover:text-amber-700 font-medium px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 transition-colors whitespace-nowrap"
                onClick={() => copyLink(inv.code)}
              >
                {copiedCode === inv.code ? 'Copied!' : 'Copy invite link'}
              </button>
            </div>
          ))}

          {/* Empty state */}
          {members.length === 0 && pendingInvites.length === 0 && (
            <p className="text-xs text-gray-400 py-1">No people yet. Send an invite below.</p>
          )}
        </div>

        {/* Invite form — always visible at bottom of people list */}
        <form onSubmit={handleInvite} className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Name"
            className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-gray-300"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-gray-300"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="px-3.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      {/* Templates */}
      <TemplatesSection orgId={orgId} />

      {/* Reset Password Modal */}
      {resetTarget && (
        <ResetPasswordModal
          member={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}

      {/* Remove Confirmation Modal */}
      {deleteTarget && (
        <RemoveMemberModal
          member={deleteTarget}
          orgId={orgId}
          onClose={() => setDeleteTarget(null)}
          onRemoved={() => {
            setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reset Password Modal                                               */
/* ------------------------------------------------------------------ */

function ResetPasswordModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await adminApi.resetPassword(member.id, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 overflow-hidden"
        style={{ animation: 'userMenuIn 0.15s ease-out' }}
      >
        <div className="px-6 pt-5 pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Reset Password</h3>
          <p className="text-sm text-gray-500 mb-4">
            Reset password for <span className="font-medium text-gray-700">{member.name}</span>{' '}
            <span className="text-gray-400">({member.email})</span>
          </p>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mx-auto mb-2">
                <polyline points="2 8 6 12 14 4" />
              </svg>
              <p className="text-sm font-medium text-green-800">Password reset successfully</p>
              <p className="text-xs text-green-600 mt-1">
                They'll be asked to set a new password on their next login.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                <div className="flex gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0 mt-0.5">
                    <path d="M8 1L1 15h14L8 1z" />
                    <line x1="8" y1="6" x2="8" y2="9" />
                    <circle cx="8" cy="12" r="0.5" fill="currentColor" />
                  </svg>
                  <p className="text-xs text-amber-800">
                    This will replace the user's current password. They'll be forced to set a new one on their next login.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <label className="block text-xs font-medium text-gray-500 mb-1">Temporary Password</label>
                <div className="relative mb-3">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoFocus
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || password.length < 8}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {success && (
          <div className="px-6 pb-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Remove Member Modal                                                */
/* ------------------------------------------------------------------ */

function RemoveMemberModal({
  member,
  orgId,
  onClose,
  onRemoved,
}: {
  member: Member;
  orgId: string;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRemove = async () => {
    setError('');
    setSubmitting(true);
    try {
      await adminApi.removeMember(member.id, orgId);
      onRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden"
        style={{ animation: 'userMenuIn 0.15s ease-out' }}
      >
        <div className="px-6 pt-5 pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Remove Member</h3>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to remove{' '}
            <span className="font-medium text-gray-700">{member.name}</span>{' '}
            <span className="text-gray-400">({member.email})</span>{' '}
            from this company?
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Their account won't be deleted, but they'll lose access to this company's brochures.
          </p>

          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={submitting}
              className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Templates Section                                                  */
/* ------------------------------------------------------------------ */

function TemplatesSection({ orgId }: { orgId: string }) {
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

/* ------------------------------------------------------------------ */
/*  Templates Tab (global template registry)                           */
/* ------------------------------------------------------------------ */

function TemplatesTab({ onPreviewTemplate }: { onPreviewTemplate: (data: BrochureData) => void }) {
  const { organization } = useAuth();
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
                      <button
                        onClick={() => handleView(tpl)}
                        disabled={!hasCode}
                        className="flex items-center gap-1.5 bg-black/5 hover:bg-amber-500 text-gray-400 hover:text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/5 disabled:hover:text-gray-400"
                        title={hasCode ? 'Preview in editor' : 'No code registered yet'}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3C4.5 3 1.5 8 1.5 8s3 5 6.5 5 6.5-5 6.5-5-3-5-6.5-5z" />
                          <circle cx="8" cy="8" r="2" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => handleDuplicate(tpl)}
                        className="flex items-center gap-1.5 bg-black/5 hover:bg-gray-600 text-gray-400 hover:text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                        title="Duplicate template"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="5" width="9" height="9" rx="1.5" />
                          <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
                        </svg>
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleDelete(tpl)}
                        disabled={tpl.usage_count > 0}
                        className="flex items-center gap-1.5 bg-black/5 hover:bg-red-600 text-gray-400 hover:text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/5 disabled:hover:text-gray-400"
                        title={tpl.usage_count > 0 ? `Assigned to ${tpl.usage_count} ${tpl.usage_count === 1 ? 'company' : 'companies'}` : 'Delete template'}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                          <path d="M6.5 7v4M9.5 7v4" />
                        </svg>
                        Delete
                      </button>
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
