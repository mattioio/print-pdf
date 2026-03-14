import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, type Member, type Invitation, type AdminCompanySettings, type AdminCompanyAgent } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import ResetPasswordModal from './ResetPasswordModal';
import RemoveMemberModal from './RemoveMemberModal';
import TemplatesSection from './TemplatesSection';
import CompanySettingsTab from './CompanySettingsTab';

type DetailTab = 'editors' | 'templates' | 'settings' | 'delete';

export default function CompanyDetail({ orgId, onAgencyNameChange, onDeleted }: { orgId: string; onAgencyNameChange?: (name: string) => void; onDeleted?: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<DetailTab>('editors');
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [initialSettings, setInitialSettings] = useState<AdminCompanySettings | null>(null);
  const [initialAgents, setInitialAgents] = useState<AdminCompanyAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const nameTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadData = useCallback(async () => {
    try {
      const data = await adminApi.getCompanyDetails(orgId);
      setMembers(data.members);
      setInvitations(data.invitations);
      setInitialSettings(data.settings);
      setInitialAgents(data.agents);
    } catch (err) {
      console.error('Failed to load company details:', err);
      toast('Failed to load company details', 'error');
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

  const handleDeleteInvite = async (inv: Invitation) => {
    try {
      await adminApi.deleteInvitation(orgId, inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    } catch {
      toast('Failed to revoke invitation', 'error');
    }
  };

  const handleNameChange = (memberId: string, name: string) => {
    setEditName(name);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, name } : m)));
    clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => {
      adminApi.updateMemberName(memberId, name).catch(() => {
        toast("Couldn't update name", 'error');
      });
    }, 500);
  };

  const handleDeleteCompany = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this company? This will permanently remove all members, documents, settings, and invitations. This action cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await adminApi.deleteCompany(orgId);
      toast('Company deleted', 'success');
      onDeleted?.();
    } catch {
      toast('Failed to delete company', 'error');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-5 pb-4 flex justify-center">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingInvites = invitations.filter((inv) => !inv.used_at);

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {(['editors', 'templates', 'settings', 'delete'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              tab === t
                ? t === 'delete'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'bg-white text-gray-900 shadow-sm'
                : t === 'delete'
                  ? 'text-gray-400 hover:text-red-500'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'editors' ? 'Editors' : t === 'templates' ? 'Templates' : t === 'settings' ? 'Settings' : 'Delete'}
          </button>
        ))}
      </div>

      {/* Editors tab */}
      {tab === 'editors' && (
        <div>
          <div className="space-y-2">
            {/* Active members */}
            {members.map((m) => {
              const isEditing = editingId === m.id;
              return (
                <div key={m.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all">
                  {/* Card header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => {
                      if (isEditing) {
                        setEditingId(null);
                      } else {
                        setEditingId(m.id);
                        setEditName(m.name || '');
                      }
                    }}
                  >
                    {m.image ? (
                      <img src={m.image} alt="" className="w-8 h-8 rounded-full shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                        {m.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                    <button
                      className="text-xs text-gray-400 hover:text-amber-600 font-medium px-2 py-1 rounded-md hover:bg-amber-50 transition-colors shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditing) {
                          setEditingId(null);
                        } else {
                          setEditingId(m.id);
                          setEditName(m.name || '');
                        }
                      }}
                    >
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                  </div>

                  {/* Edit accordion */}
                  {isEditing && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Name</label>
                        <input
                          className={inputClass}
                          value={editName}
                          onChange={(e) => handleNameChange(m.id, e.target.value)}
                          placeholder="Full name"
                        />
                      </div>

                      <div className="flex gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11.5 1.5l3 3L5 14H2v-3z" />
                            <path d="M9.5 3.5l3 3" />
                          </svg>
                          Editor
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="12" height="11" rx="1.5" />
                            <path d="M2 6.5h12" />
                            <path d="M5.5 1.5v3M10.5 1.5v3" />
                          </svg>
                          {new Date(m.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
                          onClick={() => setResetTarget(m)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                          Reset password
                        </button>
                        <button
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          onClick={() => setDeleteTarget(m)}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                            <path d="M6.5 7v4M9.5 7v4" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <>
                {members.length > 0 && (
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide pt-2">Pending invites</p>
                )}
                {pendingInvites.map((inv) => {
                  const isEditingInv = editingId === `inv-${inv.id}`;
                  return (
                    <div key={inv.id} className="bg-white rounded-xl border border-dashed border-gray-200 overflow-hidden transition-all">
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => setEditingId(isEditingInv ? null : `inv-${inv.id}`)}
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-500 truncate">
                            {inv.name || inv.email}
                          </p>
                          {inv.name && (
                            <p className="text-xs text-gray-300 truncate">{inv.email}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium shrink-0">
                          Invited
                        </span>
                      </div>

                      {isEditingInv && (
                        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                          <div className="flex gap-4">
                            {inv.name && (
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Name</label>
                                <p className="text-sm text-gray-700">{inv.name}</p>
                              </div>
                            )}
                            <div className="flex-1">
                              <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Invited</label>
                              <p className="text-sm text-gray-700">
                                {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
                              onClick={() => copyLink(inv.code)}
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                                <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
                              </svg>
                              {copiedCode === inv.code ? 'Copied!' : 'Copy invite link'}
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                              onClick={() => handleDeleteInvite(inv)}
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
                                <path d="M6.5 7v4M9.5 7v4" />
                              </svg>
                              Revoke invite
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Empty state */}
            {members.length === 0 && pendingInvites.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg py-6 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto mb-2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
                </svg>
                <p className="text-sm text-gray-400">No editors yet</p>
                <p className="text-xs text-gray-300 mt-0.5">Send an invite below to add someone</p>
              </div>
            )}
          </div>

          {/* Invite form */}
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
      )}

      {/* Templates tab */}
      {tab === 'templates' && (
        <TemplatesSection orgId={orgId} />
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <CompanySettingsTab
          orgId={orgId}
          initialSettings={initialSettings}
          initialAgents={initialAgents}
          onAgencyNameChange={onAgencyNameChange}
        />
      )}

      {/* Delete tab */}
      {tab === 'delete' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800 mb-1">Delete this company</h3>
                <p className="text-xs text-red-700 leading-relaxed">
                  This will permanently delete the company and all associated data including members, documents, settings, agents, template assignments, and pending invitations. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDeleteCompany}
            disabled={deleting}
            className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete company'}
          </button>
        </div>
      )}

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
