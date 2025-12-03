export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl =
    (import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const appId = (import.meta.env.VITE_APP_ID ?? "").trim();

  if (!oauthPortalUrl) {
    // This should not happen in a browser environment, but as a safeguard:
    console.warn(
      "[Auth] VITE_OAUTH_PORTAL_URL is not set and window.location.origin is not available."
    );
    // Return a non-functional string or handle as appropriate, instead of throwing.
    return "#";
  }
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const normalizedBase = oauthPortalUrl.replace(/\/+$/, "");
    const url = new URL(`${normalizedBase}/app-auth`);
    if (appId) {
      url.searchParams.set("appId", appId);
    }
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    throw new Error(
      `[Auth] Invalid VITE_OAUTH_PORTAL_URL: ${oauthPortalUrl}\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}\n` +
      "Please ensure the URL is valid (e.g., https://oauth.example.com)"
    );
  }
};
