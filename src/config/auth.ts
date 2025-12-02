// OAuth portal URL configuration for the app.
const AUTH_URL = import.meta.env.VITE_OAUTH_PORTAL_URL;

if (!AUTH_URL) {
  throw new Error(
    "[Auth] VITE_OAUTH_PORTAL_URL is not set. Please add it to your .env file.\n" +
    "Example: VITE_OAUTH_PORTAL_URL=https://oauth.example.com"
  );
}

export { AUTH_URL };
