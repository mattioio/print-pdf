import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateInvite, acceptInvite } from '../lib/adminApi';

interface InviteSignupProps {
  code: string;
  onDone: () => void;
}

export default function InviteSignup({ code, onDone }: InviteSignupProps) {
  const { signUpWithEmail, refreshSession } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState('');

  // Validate the invite code on mount
  useEffect(() => {
    validateInvite(code)
      .then(({ email: e, name: n, orgName: o }) => {
        setInviteEmail(e);
        setEmail(e);
        if (n) {
          setInviteName(n);
          setName(n);
        }
        setOrgName(o);
        setValidating(false);
      })
      .catch((err) => {
        setInvalid(err.message || 'Invalid invitation');
        setValidating(false);
      });
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Create account via Better Auth
      await signUpWithEmail(email, password, name);
      // 2. Accept the invite (adds user to org)
      await acceptInvite(code);
      // 3. Refresh session to pick up org membership
      await refreshSession();
      // 4. Clear invite from URL and go to dashboard
      window.history.replaceState({}, '', '/');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-sm text-gray-500">{invalid}</p>
          <a href="/" className="inline-block mt-6 text-sm text-amber-600 hover:underline font-medium">
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Join {orgName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create your account to get started
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                autoFocus={!inviteName}
                readOnly={!!inviteName}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${inviteName ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={!!inviteEmail}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${inviteEmail ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="w-full py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account & join'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600">
            Already have an account? Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
