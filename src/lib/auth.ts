import { createAuthClient } from 'better-auth/react';
import { organizationClient, jwtClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: `${window.location.origin}/neon-auth`,
  plugins: [organizationClient(), jwtClient()],
});
