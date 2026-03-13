import { useAuth } from '../context/AuthContext';

export default function JoinCompany() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
          Your account isn&apos;t linked to a company yet.
          Please ask your administrator to send you an invitation.
        </p>
        <button
          type="button"
          className="mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
