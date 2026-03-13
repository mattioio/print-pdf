import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCompanySettings } from '../lib/api';

export default function JoinCompany() {
  const { user, signOut, createOrganization } = useAuth();
  const [mode, setMode] = useState<'choose' | 'create'>('choose');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    setError('');
    setLoading(true);
    try {
      const orgId = await createOrganization(companyName.trim());
      // Seed company_settings with the name so it shows up in Settings immediately
      apiCompanySettings.upsert(orgId, { agency_name: companyName.trim() }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up your company workspace to get started
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {mode === 'choose' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Create a company workspace where your team can collaborate on property brochures.
              </p>

              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                onClick={() => setMode('create')}
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 block">Create a company</span>
                  <span className="text-xs text-gray-500">Start a new workspace for your agency</span>
                </div>
              </button>

              <p className="text-xs text-gray-400 text-center pt-2">
                Your team members can join later via invitation
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                onClick={() => { setMode('choose'); setError(''); }}
              >
                &larr; Back
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Jenkins Law"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading || !companyName.trim()}
                className="w-full py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create company'}
              </button>
            </form>
          )}
        </div>

        {/* Sign out link */}
        <p className="text-center mt-4">
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={signOut}
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
