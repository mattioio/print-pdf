import { createAuthClient } from 'better-auth/react';
import { organizationClient, jwtClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_NEON_AUTH_URL,
  plugins: [organizationClient(), jwtClient()],
});
