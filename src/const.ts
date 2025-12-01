export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = (import.meta.env.VITE_OAUTH_PORTAL_URL ?? "").trim();
  const appId = (import.meta.env.VITE_APP_ID ?? "").trim();
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  if (!oauthPortalUrl) {
    console.warn(
      "[Auth] Missing VITE_OAUTH_PORTAL_URL; falling back to current origin."
    );
    return window.location.origin;
  }

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
    console.error("[Auth] Invalid VITE_OAUTH_PORTAL_URL", error);
    return window.location.origin;
  }
};
