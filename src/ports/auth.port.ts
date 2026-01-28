/**
 * Auth Port - Interface for authentication management
 *
 * Defines the contract for authenticating with various platforms
 */
import type {
  Platform,
  AuthMethod,
  Credential,
  CookieCredential,
  OAuthToken,
  ApiKeyCredential,
  AuthSession,
} from "../domain/auth.schema";

// =============================================================================
// Auth Port Interface
// =============================================================================

export interface AuthPort {
  /**
   * Check if a platform has valid credentials
   */
  isAuthenticated(platform: Platform): Promise<boolean>;

  /**
   * Get auth session state for a platform
   */
  getSession(platform: Platform): Promise<AuthSession | null>;

  /**
   * Get all configured credentials (metadata only, no secrets)
   */
  listCredentials(): Promise<Credential[]>;

  /**
   * Add or update credentials for a platform
   */
  setCredential(
    platform: Platform,
    method: AuthMethod,
    credential: CookieCredential | OAuthToken | ApiKeyCredential,
  ): Promise<void>;

  /**
   * Remove credentials for a platform
   */
  removeCredential(platform: Platform): Promise<void>;

  /**
   * Validate current credentials are still working
   */
  validateCredential(platform: Platform): Promise<boolean>;

  /**
   * Get request headers for authenticated requests
   */
  getAuthHeaders(platform: Platform): Promise<Record<string, string>>;

  /**
   * Get cookies for authenticated requests
   */
  getAuthCookies(domain: string): Promise<string | null>;
}

// =============================================================================
// Cookie Auth Adapter Interface
// =============================================================================

export interface CookieAuthPort {
  /**
   * Import cookies from browser export (Netscape format)
   */
  importFromNetscapeFormat(cookieFile: string): Promise<CookieCredential>;

  /**
   * Import cookies from JSON format
   */
  importFromJson(cookieJson: string): Promise<CookieCredential>;

  /**
   * Get cookie header string for a domain
   */
  getCookieHeader(domain: string): Promise<string | null>;

  /**
   * Validate cookies are still valid for a domain
   */
  validateCookies(domain: string): Promise<boolean>;
}

// =============================================================================
// OAuth Adapter Interface
// =============================================================================

export interface OAuthPort {
  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(platform: Platform): string;

  /**
   * Exchange authorization code for tokens
   */
  exchangeCode(platform: Platform, code: string): Promise<OAuthToken>;

  /**
   * Refresh access token
   */
  refreshToken(platform: Platform): Promise<OAuthToken>;

  /**
   * Revoke access
   */
  revokeAccess(platform: Platform): Promise<void>;
}

// =============================================================================
// Browser Session Adapter Interface (Fallback for JS-heavy sites)
// =============================================================================

export interface BrowserSessionPort {
  /**
   * Check if browser session is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Scrape a page using browser session (for JS-required sites)
   */
  scrapePage(url: string): Promise<{
    html: string;
    title: string;
    cookies: CookieCredential["cookies"];
  }>;

  /**
   * Extract cookies from browser for a domain
   */
  extractCookies(domain: string): Promise<CookieCredential["cookies"]>;
}
