// OAuth portal URL configuration for the app.
const AUTH_URL =
  import.meta.env.VITE_OAUTH_PORTAL_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

if (!AUTH_URL) {
  // This should not happen in a browser environment, but as a safeguard:
  console.warn(
    "[Auth] VITE_OAUTH_PORTAL_URL is not set and window.location.origin is not available."
  );
}
export { AUTH_URL };
