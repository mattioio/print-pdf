import { useState, useEffect, useCallback } from 'react';
import { adminApi, type Company, type Member, type Invitation } from '../lib/adminApi';
import { templates } from '../components/pdf/templates';

interface AdminProps {
  onBack: () => void;
}

export default function Admin({ onBack }: AdminProps) {
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
          <div className="w-20" /> {/* Balance the back button width */}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-8">
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
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Company Form                                                */
/* ------------------------------------------------------------------ */

function CreateCompanyForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('classic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    try {
      await adminApi.createCompany(name.trim(), templateId);
      setName('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const templateKeys = Object.keys(templates);

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
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            >
              {templateKeys.map((k) => (
                <option key={k} value={k}>{templates[k].name}</option>
              ))}
            </select>
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
          <h3 className="text-sm font-semibold text-gray-900">{company.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {templates[company.template_id]?.name ?? company.template_id} template
            {' \u00b7 '}
            {company.member_count} member{company.member_count !== 1 ? 's' : ''}
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

  return (
    <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-4">
      {/* Members */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 mb-2">Members</h4>
        {members.length === 0 ? (
          <p className="text-xs text-gray-400">No members yet.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                {m.image ? (
                  <img src={m.image} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-400">
                    {m.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-medium uppercase px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
                    onClick={() => setResetTarget(m)}
                  >
                    Reset Password
                  </button>
                  <button
                    className="text-[10px] text-red-500 hover:text-red-700 font-medium uppercase px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                    onClick={() => setDeleteTarget(m)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 mb-2">Invite User</h4>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Full name"
            className="w-36 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="user@company.com"
            required
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {inviting ? 'Sending...' : 'Create Invite'}
          </button>
        </form>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">Invitations</h4>
          <div className="space-y-1.5">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 text-sm">
                <span className={`flex-1 ${inv.used_at ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                  {inv.email}
                </span>
                {inv.used_at ? (
                  <span className="text-[10px] text-green-500 uppercase font-medium">Accepted</span>
                ) : (
                  <button
                    className="text-[10px] text-amber-600 hover:text-amber-700 font-medium uppercase"
                    onClick={() => copyLink(inv.code)}
                  >
                    {copiedCode === inv.code ? 'Copied!' : 'Copy Link'}
                  </button>
                )}
              </div>
            ))}
          </div>
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
