import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrochureProvider } from './context/BrochureContext';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Login from './pages/Login';
import JoinCompany from './pages/JoinCompany';
import InviteSignup from './pages/InviteSignup';
import Admin from './pages/Admin';
import ChangePassword from './pages/ChangePassword';
import Settings from './pages/Settings';
import type { BrochureData } from './types/brochure';

type Route =
  | { page: 'dashboard' }
  | { page: 'editor'; data: BrochureData }
  | { page: 'admin' };

function AppRoutes() {
  const { user, organization, loading, mustChangePassword, refreshSession } = useAuth();
  const [route, setRoute] = useState<Route>({ page: 'dashboard' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsRevision, setSettingsRevision] = useState(0);

  const handleEdit = useCallback((data: BrochureData) => {
    setRoute({ page: 'editor', data });
  }, []);

  const handleBack = useCallback(() => {
    setRoute({ page: 'dashboard' });
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // Check for invite code in URL
  const params = new URLSearchParams(window.location.search);
  const inviteCode = params.get('invite');
  if (inviteCode) {
    return (
      <InviteSignup
        code={inviteCode}
        onDone={() => window.location.replace('/')}
      />
    );
  }

  // Not authenticated
  if (!user) {
    return <Login />;
  }

  // Must change password before anything else
  if (mustChangePassword) {
    return <ChangePassword onDone={() => refreshSession()} />;
  }

  // No organization
  if (!organization) {
    return <JoinCompany />;
  }

  // Main app
  return (
    <>
      {route.page === 'admin' ? (
        <Admin onBack={handleBack} />
      ) : route.page === 'editor' ? (
        <BrochureProvider initial={route.data} key={route.data.id}>
          <Editor
            onBack={handleBack}
            onSettings={() => setSettingsOpen(true)}
            settingsRevision={settingsRevision}
          />
        </BrochureProvider>
      ) : (
        <Dashboard
          onEdit={handleEdit}
          onSettings={() => setSettingsOpen(true)}
          onAdmin={() => setRoute({ page: 'admin' })}
        />
      )}

      <Settings
        open={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          setSettingsRevision((r) => r + 1);
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
