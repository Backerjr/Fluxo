// OAuth configuration helper
// Reads the OAuth portal base URL from Vite env and builds the login endpoint.

function getOAuthPortalUrl() {
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;

  if (!portalUrl) {
    console.warn(
      "VITE_OAUTH_PORTAL_URL is not set; defaulting OAuth portal URL to current origin."
    );
    return `${window.location.origin}/auth/login`;
  }

  const normalized = portalUrl.endsWith("/")
    ? portalUrl.slice(0, -1)
    : portalUrl;

  return `${normalized}/auth/login`;
}

export const oauthUrl = getOAuthPortalUrl();
