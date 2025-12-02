// OAuth portal URL configuration for the app.
const AUTH_URL = import.meta.env.VITE_OAUTH_PORTAL_URL || "";

if (!AUTH_URL && typeof window !== "undefined") {
  console.warn("[Auth] VITE_OAUTH_PORTAL_URL is not set. Add it to your .env file. Falling back to current origin.");
}

export { AUTH_URL };
