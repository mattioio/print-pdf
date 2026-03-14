import { useState, useEffect, useCallback } from 'react';
import { adminApi, type Member, type Invitation, type AdminCompanySettings, type AdminCompanyAgent } from '../../lib/adminApi';
import { useToast } from '../../context/ToastContext';
import ResetPasswordModal from './ResetPasswordModal';
import RemoveMemberModal from './RemoveMemberModal';
import TemplatesSection from './TemplatesSection';
import CompanySettingsTab from './CompanySettingsTab';

type DetailTab = 'people' | 'templates' | 'settings';

export default function CompanyDetail({ orgId }: { orgId: string }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<DetailTab>('people');
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
    <div className="px-5 pb-4 border-t border-gray-100 pt-3 space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        {(['people', 'templates', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'people' ? 'People' : t === 'templates' ? 'Templates' : 'Settings'}
          </button>
        ))}
      </div>

      {/* People tab */}
      {tab === 'people' && (
        <div>
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

            {/* Pending invites */}
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
        />
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
