/**
 * Auth Manager Adapter
 *
 * Unified authentication manager that coordinates between different auth methods
 */
import type {
  AuthPort,
  CookieAuthPort,
  OAuthPort,
  BrowserSessionPort,
} from "../ports/auth.port";
import type {
  Platform,
  AuthMethod,
  Credential,
  CookieCredential,
  OAuthToken,
  ApiKeyCredential,
  AuthSession,
  PLATFORM_AUTH_CONFIGS,
} from "../domain/auth.schema";
import { CookieAuthAdapter } from "./cookie-auth.adapter";
import { ApiKeyAuthAdapter } from "./api-key-auth.adapter";

// Credential metadata storage
const credentialStore = new Map<Platform, Credential>();
const sessionCache = new Map<Platform, AuthSession>();

export class AuthManagerAdapter implements AuthPort {
  private cookieAuth: CookieAuthAdapter;
  private apiKeyAuth: ApiKeyAuthAdapter;

  constructor() {
    this.cookieAuth = new CookieAuthAdapter();
    this.apiKeyAuth = new ApiKeyAuthAdapter();
  }

  async isAuthenticated(platform: Platform): Promise<boolean> {
    const session = await this.getSession(platform);
    return session?.isAuthenticated ?? false;
  }

  async getSession(platform: Platform): Promise<AuthSession | null> {
    const cached = sessionCache.get(platform);
    if (cached) {
      // Return cached if checked within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (cached.lastChecked > fiveMinutesAgo) {
        return cached;
      }
    }

    // Validate and update session
    const isValid = await this.validateCredential(platform);
    const session: AuthSession = {
      platform,
      isAuthenticated: isValid,
      lastChecked: new Date(),
    };

    sessionCache.set(platform, session);
    return session;
  }

  async listCredentials(): Promise<Credential[]> {
    return Array.from(credentialStore.values());
  }

  async setCredential(
    platform: Platform,
    method: AuthMethod,
    credential: CookieCredential | OAuthToken | ApiKeyCredential,
  ): Promise<void> {
    // Store the actual credential in the appropriate adapter
    switch (method) {
      case "cookie":
        this.cookieAuth.storeCredential(credential as CookieCredential);
        break;
      case "api_key":
        this.apiKeyAuth.setApiKey(
          platform,
          (credential as ApiKeyCredential).apiKey,
        );
        break;
      case "oauth":
        // OAuth tokens would be stored in a dedicated OAuth adapter
        // For now, we'll handle this when implementing full OAuth flow
        break;
      case "browser_session":
        // Browser session cookies
        if ("cookies" in credential) {
          this.cookieAuth.storeCredential(credential as CookieCredential);
        }
        break;
    }

    // Store metadata
    const meta: Credential = {
      id: `${platform}-${method}`,
      platform,
      method,
      createdAt: new Date(),
      isValid: true,
    };

    if ("expiresAt" in credential && credential.expiresAt) {
      meta.expiresAt = credential.expiresAt;
    }

    credentialStore.set(platform, meta);
    sessionCache.delete(platform); // Invalidate session cache
  }

  async removeCredential(platform: Platform): Promise<void> {
    const credential = credentialStore.get(platform);
    if (!credential) return;

    switch (credential.method) {
      case "cookie":
      case "browser_session":
        // Would need to know the domain to remove
        break;
      case "api_key":
        this.apiKeyAuth.removeApiKey(platform);
        break;
    }

    credentialStore.delete(platform);
    sessionCache.delete(platform);
  }

  async validateCredential(platform: Platform): Promise<boolean> {
    const credential = credentialStore.get(platform);
    if (!credential) return false;

    // Check expiration
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      credential.isValid = false;
      return false;
    }

    switch (credential.method) {
      case "api_key":
        return this.apiKeyAuth.validateApiKey(platform);
      case "cookie":
      case "browser_session":
        // Cookie validation would check if cookies are still accepted
        return true; // Assume valid for now
      default:
        return credential.isValid;
    }
  }

  async getAuthHeaders(platform: Platform): Promise<Record<string, string>> {
    const credential = credentialStore.get(platform);
    if (!credential) return {};

    switch (credential.method) {
      case "api_key":
        return this.apiKeyAuth.getAuthHeaders(platform) || {};
      case "oauth":
        // Would return Bearer token
        return {};
      default:
        return {};
    }
  }

  async getAuthCookies(domain: string): Promise<string | null> {
    return this.cookieAuth.getCookieHeader(domain);
  }

  // ==========================================================================
  // Convenience methods
  // ==========================================================================

  getCookieAdapter(): CookieAuthAdapter {
    return this.cookieAuth;
  }

  getApiKeyAdapter(): ApiKeyAuthAdapter {
    return this.apiKeyAuth;
  }
}

// Singleton instance
let authManager: AuthManagerAdapter | null = null;

export function getAuthManager(): AuthManagerAdapter {
  if (!authManager) {
    authManager = new AuthManagerAdapter();
  }
  return authManager;
}
