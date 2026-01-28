/**
 * API Key Auth Adapter
 *
 * Manages API key-based authentication for services like
 * PubMed, Semantic Scholar, Reddit, etc.
 */
import type {
  Platform,
  ApiKeyCredential,
  PLATFORM_AUTH_CONFIGS,
} from "../domain/auth.schema";

// Secure storage for API keys (in-memory for now)
const apiKeyStore = new Map<Platform, ApiKeyCredential>();

// Platform-specific header configurations
const PLATFORM_HEADER_CONFIGS: Partial<
  Record<Platform, { headerName: string; headerPrefix: string }>
> = {
  pubmed: { headerName: "api_key", headerPrefix: "" },
  semantic_scholar: { headerName: "x-api-key", headerPrefix: "" },
  reddit: { headerName: "Authorization", headerPrefix: "Bearer" },
};

export class ApiKeyAuthAdapter {
  /**
   * Store API key for a platform
   */
  setApiKey(platform: Platform, apiKey: string): void {
    const config = PLATFORM_HEADER_CONFIGS[platform] || {
      headerName: "Authorization",
      headerPrefix: "Bearer",
    };

    apiKeyStore.set(platform, {
      apiKey,
      headerName: config.headerName,
      headerPrefix: config.headerPrefix,
    });
  }

  /**
   * Get API key credential for a platform
   */
  getCredential(platform: Platform): ApiKeyCredential | null {
    return apiKeyStore.get(platform) || null;
  }

  /**
   * Get auth headers for a platform
   */
  getAuthHeaders(platform: Platform): Record<string, string> | null {
    const credential = apiKeyStore.get(platform);
    if (!credential) return null;

    const value = credential.headerPrefix
      ? `${credential.headerPrefix} ${credential.apiKey}`
      : credential.apiKey;

    return { [credential.headerName]: value };
  }

  /**
   * Check if platform has API key configured
   */
  hasApiKey(platform: Platform): boolean {
    return apiKeyStore.has(platform);
  }

  /**
   * Remove API key for a platform
   */
  removeApiKey(platform: Platform): void {
    apiKeyStore.delete(platform);
  }

  /**
   * Validate API key works (platform-specific)
   */
  async validateApiKey(platform: Platform): Promise<boolean> {
    const credential = apiKeyStore.get(platform);
    if (!credential) return false;

    try {
      const headers = this.getAuthHeaders(platform);
      if (!headers) return false;

      // Platform-specific validation endpoints
      const validationUrls: Partial<Record<Platform, string>> = {
        semantic_scholar:
          "https://api.semanticscholar.org/graph/v1/paper/649def34f8be52c8b66281af98ae884c09aef38b",
        reddit: "https://oauth.reddit.com/api/v1/me",
      };

      const url = validationUrls[platform];
      if (!url) return true; // No validation endpoint, assume valid

      const response = await fetch(url, { headers, method: "GET" });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List all platforms with API keys
   */
  listPlatforms(): Platform[] {
    return Array.from(apiKeyStore.keys());
  }
}
