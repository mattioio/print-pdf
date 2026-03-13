import { useState, useEffect, useCallback } from 'react';
import { adminApi, type Company, type Member } from '../lib/adminApi';
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
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await adminApi.getCompanyMembers(orgId);
      setMembers(data.members);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim() || !userPassword) return;
    setError('');
    setCreating(true);
    try {
      await adminApi.createUser(orgId, userEmail.trim(), userPassword);
      setCreated({ email: userEmail.trim(), password: userPassword });
      setUserEmail('');
      setUserPassword('');
      loadData(); // Refresh members list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
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
          <div className="space-y-1.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 text-sm">
                {m.image ? (
                  <img src={m.image} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-400">
                    {m.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-gray-900 font-medium">{m.name}</span>
                <span className="text-gray-400">{m.email}</span>
                <span className="text-[10px] text-gray-300 uppercase">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User */}
      <div>
        <h4 className="text-xs font-medium text-gray-400 mb-2">Add User</h4>
        <form onSubmit={handleCreateUser} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => { setUserEmail(e.target.value); setCreated(null); }}
              placeholder="user@company.com"
              required
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <input
              type="text"
              value={userPassword}
              onChange={(e) => { setUserPassword(e.target.value); setCreated(null); }}
              placeholder="Temporary password"
              required
              minLength={8}
              className="w-44 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={creating || !userEmail.trim() || userPassword.length < 8}
              className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {created && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-medium text-green-800 mb-1">User created! Share these credentials:</p>
              <p className="text-xs text-green-700 font-mono">
                Email: {created.email}<br />
                Password: {created.password}
              </p>
              <p className="text-[10px] text-green-600 mt-1">They will be asked to change their password on first login.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
