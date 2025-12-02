// OAuth configuration helper
// Reads the OAuth portal base URL from Vite env and builds the login endpoint.

function getOAuthPortalUrl(): string {
  const portalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;

  if (!portalUrl) {
    throw new Error(
      "[Auth] VITE_OAUTH_PORTAL_URL is required but not set.\n" +
      "Please add it to your .env file:\n" +
      "VITE_OAUTH_PORTAL_URL=https://oauth.example.com"
    );
  }

  const normalized = portalUrl.endsWith("/")
    ? portalUrl.slice(0, -1)
    : portalUrl;

  return `${normalized}/auth/login`;
}

export const oauthUrl = getOAuthPortalUrl();
