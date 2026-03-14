import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { BrochureProvider } from './context/BrochureContext';
import { apiBrochures, apiCompanySettings, apiCompanyAgents } from './lib/api';
import { rowToBrochure } from './lib/convert';
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

/* ------------------------------------------------------------------ */
/*  URL-based routing                                                  */
/* ------------------------------------------------------------------ */

type Route =
  | { page: 'dashboard' }
  | { page: 'editor'; id: string }
  | { page: 'admin' };

function parseRoute(): Route {
  const path = window.location.pathname;
  const editorMatch = path.match(/^\/editor\/(.+)$/);
  if (editorMatch) return { page: 'editor', id: editorMatch[1] };
  if (path === '/admin') return { page: 'admin' };
  return { page: 'dashboard' };
}

function navigateTo(path: string) {
  history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/* ------------------------------------------------------------------ */
/*  Not-found fallback for invalid brochure IDs                        */
/* ------------------------------------------------------------------ */

function NotFoundCard({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Brochure not found</h2>
        <p className="text-sm text-gray-500 mb-4">This brochure may have been deleted or the link is invalid.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App routes                                                         */
/* ------------------------------------------------------------------ */

function AppRoutes() {
  const { user, organization, mustChangePassword, loading, refreshSession } = useAuth();
  const { toast } = useToast();
  const [route, setRoute] = useState<Route>(parseRoute);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsRevision, setSettingsRevision] = useState(0);

  // Async editor data (loaded from API when navigating to /editor/:id)
  const [editorData, setEditorData] = useState<BrochureData | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState(false);

  const orgId = organization?.id ?? '';

  // When org changes (admin switching companies), go back to dashboard
  const prevOrgRef = useRef(organization?.id);
  useEffect(() => {
    if (prevOrgRef.current && organization?.id && prevOrgRef.current !== organization.id) {
      navigateTo('/');
      setSettingsOpen(false);
    }
    prevOrgRef.current = organization?.id;
  }, [organization?.id]);

  // Load brochure data when route is editor
  useEffect(() => {
    if (route.page !== 'editor') {
      setEditorData(null);
      setEditorError(false);
      return;
    }
    // Skip fetch if data already pre-loaded (navigated from Dashboard)
    if (editorData?.id === route.id) return;
    if (!orgId) return;

    let cancelled = false;
    setEditorLoading(true);
    setEditorError(false);

    (async () => {
      const row = await apiBrochures.get(route.id);
      if (!row) {
        if (!cancelled) {
          setEditorError(true);
          setEditorLoading(false);
        }
        return;
      }
      if (cancelled) return;
      const [settings, agents] = await Promise.all([
        apiCompanySettings.get(orgId),
        apiCompanyAgents.list(orgId),
      ]);
      if (cancelled) return;
      const brochure = rowToBrochure(row, settings, agents);
      setEditorData(brochure);
      setEditorLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setEditorError(true);
        setEditorLoading(false);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.page, route.page === 'editor' ? (route as { id: string }).id : null, orgId]);

  const handleEdit = useCallback((data: BrochureData) => {
    setEditorData(data); // pre-fill to avoid redundant fetch
    navigateTo(`/editor/${data.id}`);
  }, []);

  const handleAdmin = useCallback(() => {
    navigateTo('/admin');
  }, []);

  const handleBack = useCallback(() => {
    navigateTo('/');
  }, []);

  // Browser back/forward button support
  useEffect(() => {
    const onPopState = () => {
      setRoute(parseRoute());
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
          <Admin onBack={handleBack} />
        ) : route.page === 'editor' ? (
          editorLoading ? PageSpinner :
          editorError ? <NotFoundCard onBack={handleBack} /> :
          editorData ? (
            <ErrorBoundary key={editorData.id}>
              <BrochureProvider initial={editorData} onSaveError={() => toast("Changes couldn't be saved", 'error')}>
                <Editor
                  onBack={handleBack}
                  onSettings={() => setSettingsOpen(true)}
                  settingsRevision={settingsRevision}
                />
              </BrochureProvider>
            </ErrorBoundary>
          ) : PageSpinner
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
