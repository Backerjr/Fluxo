// OAuth configuration helper
// Reads the OAuth portal base URL from Vite env and builds the login endpoint.

function getOAuthPortalUrl(): string {
  const portalUrl =
    import.meta.env.VITE_OAUTH_PORTAL_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!portalUrl) {
    // This should not happen in a browser environment, but as a safeguard:
    console.warn(
      "[Auth] VITE_OAUTH_PORTAL_URL is not set and window.location.origin is not available."
    );
    // Return a non-functional string or handle as appropriate, instead of throwing.
    return "#";
  }
  const normalized = portalUrl.endsWith("/")
    ? portalUrl.slice(0, -1)
    : portalUrl;

  return `${normalized}/auth/login`;
}

export const oauthUrl = getOAuthPortalUrl();
