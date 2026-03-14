import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { BrochureProvider } from './context/BrochureContext';
import Login from './pages/Login';
import ToastStack from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import type { BrochureData } from './types/brochure';

// Lazy-loaded pages (keeps initial bundle small)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const JoinCompany = lazy(() => import('./pages/JoinCompany'));
const InviteSignup = lazy(() => import('./pages/InviteSignup'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));

const PageSpinner = (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

type Route =
  | { page: 'dashboard' }
  | { page: 'editor'; data: BrochureData }
  | { page: 'admin' };

function AppRoutes() {
  const { user, organization, mustChangePassword, loading, refreshSession } = useAuth();
  const { toast } = useToast();
  const [route, setRoute] = useState<Route>({ page: 'dashboard' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsRevision, setSettingsRevision] = useState(0);

  // When org changes (admin switching companies), go back to dashboard
  const prevOrgRef = useRef(organization?.id);
  useEffect(() => {
    if (prevOrgRef.current && organization?.id && prevOrgRef.current !== organization.id) {
      setRoute({ page: 'dashboard' });
      setSettingsOpen(false);
    }
    prevOrgRef.current = organization?.id;
  }, [organization?.id]);

  const handleEdit = useCallback((data: BrochureData) => {
    history.pushState({ page: 'editor' }, '', '');
    setRoute({ page: 'editor', data });
  }, []);

  const handleAdmin = useCallback(() => {
    history.pushState({ page: 'admin' }, '', '');
    setRoute({ page: 'admin' });
  }, []);

  const handleBack = useCallback(() => {
    setRoute({ page: 'dashboard' });
  }, []);

  // Browser back button support
  useEffect(() => {
    const onPopState = () => {
      setRoute({ page: 'dashboard' });
      setSettingsOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
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
      <Suspense fallback={PageSpinner}>
        <InviteSignup
          code={inviteCode}
          onDone={() => window.location.replace('/')}
        />
      </Suspense>
    );
  }

  // Not authenticated
  if (!user) {
    return <Login />;
  }

  // Must change password (admin-reset flow)
  if (mustChangePassword) {
    return (
      <Suspense fallback={PageSpinner}>
        <ChangePassword onDone={() => refreshSession()} />
      </Suspense>
    );
  }

  // No organization
  if (!organization) {
    return (
      <Suspense fallback={PageSpinner}>
        <JoinCompany />
      </Suspense>
    );
  }

  // Main app
  return (
    <ErrorBoundary>
      <Suspense fallback={PageSpinner}>
        {route.page === 'admin' ? (
          <Admin onBack={handleBack} onPreviewTemplate={handleEdit} />
        ) : route.page === 'editor' ? (
          <ErrorBoundary key={route.data.id}>
            <BrochureProvider initial={route.data} onSaveError={() => toast("Changes couldn't be saved", 'error')}>
              <Editor
                onBack={handleBack}
                onSettings={() => setSettingsOpen(true)}
                settingsRevision={settingsRevision}
              />
            </BrochureProvider>
          </ErrorBoundary>
        ) : (
          <Dashboard
            onEdit={handleEdit}
            onSettings={() => setSettingsOpen(true)}
            onAdmin={handleAdmin}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <Settings
          open={settingsOpen}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsRevision((r) => r + 1);
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
        <ToastStack />
      </ToastProvider>
    </AuthProvider>
  );
}
