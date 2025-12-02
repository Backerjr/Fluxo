export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = (import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").trim();
  const appId = (import.meta.env.VITE_APP_ID ?? "").trim();

  if (!oauthPortalUrl) {
    throw new Error(
      "[Auth] VITE_OAUTH_PORTAL_URL is required but not set.\n" +
      "Please add it to your .env file:\n" +
      "VITE_OAUTH_PORTAL_URL=https://oauth.example.com"
    );
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
