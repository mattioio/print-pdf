import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authClient } from '../lib/auth';
import { fetchUserFlags } from '../lib/adminApi';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  mustChangePassword: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  createOrganization: (name: string) => Promise<string>;
  setActiveOrganization: (orgId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    organization: null,
    loading: true,
    mustChangePassword: false,
  });

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        setState({ user: null, organization: null, loading: false, mustChangePassword: false });
        return;
      }

      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
      };

      // Check if user must change password
      let mustChangePassword = false;
      try {
        const flags = await fetchUserFlags();
        mustChangePassword = flags.mustChangePassword;
      } catch {
        // Flags check failed — assume no change needed
      }

      // Try to load active organization
      let org: Organization | null = null;
      try {
        const orgList = await authClient.organization.list();
        if (orgList.data && orgList.data.length > 0) {
          // Use the active org from session, or fall back to first org
          const activeOrgId = (data.session as Record<string, unknown>).activeOrganizationId as string | undefined;
          const activeOrg = activeOrgId
            ? orgList.data.find((o: { id: string }) => o.id === activeOrgId) ?? orgList.data[0]
            : orgList.data[0];

          // Set it active if not already
          if (!activeOrgId || activeOrgId !== activeOrg.id) {
            await authClient.organization.setActive({ organizationId: activeOrg.id });
          }

          org = {
            id: activeOrg.id,
            name: activeOrg.name,
            slug: activeOrg.slug,
            logo: activeOrg.logo,
          };
        }
      } catch {
        // No orgs yet — that's fine
      }

      setState({ user, organization: org, loading: false, mustChangePassword });
    } catch {
      setState({ user: null, organization: null, loading: false, mustChangePassword: false });
    }
  }, []);

  // Load session on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message ?? 'Sign in failed');
    // Verify the session was actually established (catches Safari cookie issues)
    const check = await authClient.getSession();
    if (!check.data?.user) {
      throw new Error('Sign in succeeded but session was not saved. Try clearing cookies and retrying.');
    }
    await refreshSession();
  }, [refreshSession]);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const result = await authClient.signUp.email({ email, password, name });
    if (result.error) throw new Error(result.error.message);
    await refreshSession();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setState({ user: null, organization: null, loading: false, mustChangePassword: false });
  }, []);

  const createOrganization = useCallback(async (name: string): Promise<string> => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await authClient.organization.create({ name, slug });
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error('No data returned from organization create');
    await authClient.organization.setActive({ organizationId: result.data.id });
    await refreshSession();
    return result.data.id;
  }, [refreshSession]);

  const setActiveOrganization = useCallback(async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId });
    await refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        createOrganization,
        setActiveOrganization,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
