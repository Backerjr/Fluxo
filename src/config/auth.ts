// OAuth portal URL configuration for the app.
const AUTH_URL = import.meta.env.VITE_OAUTH_PORTAL_URL;

if (!AUTH_URL) {
  throw new Error("[Auth] VITE_OAUTH_PORTAL_URL is not set. Add it to your .env file.");
}

export { AUTH_URL };
