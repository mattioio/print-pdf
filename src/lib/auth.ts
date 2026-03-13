import { createAuthClient } from 'better-auth/react';
import { organizationClient, jwtClient } from 'better-auth/client/plugins';

// In production, route auth through our own API proxy (/api/auth/*)
// so cookies are same-origin and work on Safari/iPad.
// In development, use the Neon Auth URL directly.
const baseURL = import.meta.env.DEV
  ? import.meta.env.VITE_NEON_AUTH_URL
  : window.location.origin;

export const authClient = createAuthClient({
  baseURL,
  plugins: [organizationClient(), jwtClient()],
});
