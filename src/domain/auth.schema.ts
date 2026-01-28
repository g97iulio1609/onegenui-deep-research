/**
 * Authentication Domain Schemas
 *
 * Types for managing authenticated access to premium sources
 */
import { z } from "zod";

// =============================================================================
// Auth Method Types
// =============================================================================

export const AuthMethodSchema = z.enum([
  "cookie",
  "oauth",
  "api_key",
  "browser_session",
]);

export type AuthMethod = z.infer<typeof AuthMethodSchema>;

// =============================================================================
// Platform Configuration
// =============================================================================

export const PlatformSchema = z.enum([
  "google_scholar",
  "pubmed",
  "semantic_scholar",
  "arxiv",
  "twitter",
  "linkedin",
  "reddit",
  "bloomberg",
  "reuters",
  "medium",
  "substack",
  "custom",
]);

export type Platform = z.infer<typeof PlatformSchema>;

// =============================================================================
// Credential Storage
// =============================================================================

export const CredentialSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  method: AuthMethodSchema,
  label: z.string().optional(),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
  isValid: z.boolean(),
  // Actual secrets stored encrypted separately
});

export type Credential = z.infer<typeof CredentialSchema>;

// =============================================================================
// Cookie Auth
// =============================================================================

export const CookieCredentialSchema = z.object({
  domain: z.string(),
  cookies: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      domain: z.string(),
      path: z.string().default("/"),
      expires: z.number().optional(),
      httpOnly: z.boolean().optional(),
      secure: z.boolean().optional(),
      sameSite: z.enum(["Strict", "Lax", "None"]).optional(),
    }),
  ),
});

export type CookieCredential = z.infer<typeof CookieCredentialSchema>;

// =============================================================================
// OAuth Config
// =============================================================================

export const OAuthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  tokenType: z.string().default("Bearer"),
  expiresIn: z.number().optional(),
  expiresAt: z.date().optional(),
  scope: z.string().optional(),
});

export type OAuthToken = z.infer<typeof OAuthTokenSchema>;

export const OAuthConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string().optional(),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  redirectUri: z.string().url(),
  scope: z.string().optional(),
});

export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;

// =============================================================================
// API Key
// =============================================================================

export const ApiKeyCredentialSchema = z.object({
  apiKey: z.string(),
  headerName: z.string().default("Authorization"),
  headerPrefix: z.string().default("Bearer"),
});

export type ApiKeyCredential = z.infer<typeof ApiKeyCredentialSchema>;

// =============================================================================
// Auth Session State
// =============================================================================

export const AuthSessionSchema = z.object({
  platform: PlatformSchema,
  isAuthenticated: z.boolean(),
  lastChecked: z.date(),
  error: z.string().optional(),
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;

// =============================================================================
// Platform Auth Requirements
// =============================================================================

export interface PlatformAuthConfig {
  platform: Platform;
  displayName: string;
  description: string;
  supportedMethods: AuthMethod[];
  requiredForPremium: boolean;
  domains: string[];
  icon?: string;
}

export const PLATFORM_AUTH_CONFIGS: Record<Platform, PlatformAuthConfig> = {
  google_scholar: {
    platform: "google_scholar",
    displayName: "Google Scholar",
    description: "Access academic papers and citations",
    supportedMethods: ["cookie", "browser_session"],
    requiredForPremium: false,
    domains: ["scholar.google.com"],
  },
  pubmed: {
    platform: "pubmed",
    displayName: "PubMed",
    description: "Medical and life sciences literature",
    supportedMethods: ["api_key"],
    requiredForPremium: false,
    domains: ["pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov"],
  },
  semantic_scholar: {
    platform: "semantic_scholar",
    displayName: "Semantic Scholar",
    description: "AI-powered academic search",
    supportedMethods: ["api_key"],
    requiredForPremium: false,
    domains: ["semanticscholar.org", "api.semanticscholar.org"],
  },
  arxiv: {
    platform: "arxiv",
    displayName: "arXiv",
    description: "Preprints in physics, math, CS",
    supportedMethods: [],
    requiredForPremium: false,
    domains: ["arxiv.org"],
  },
  twitter: {
    platform: "twitter",
    displayName: "Twitter / X",
    description: "Real-time social insights",
    supportedMethods: ["cookie", "oauth", "browser_session"],
    requiredForPremium: true,
    domains: ["twitter.com", "x.com"],
  },
  linkedin: {
    platform: "linkedin",
    displayName: "LinkedIn",
    description: "Professional network insights",
    supportedMethods: ["cookie", "browser_session"],
    requiredForPremium: true,
    domains: ["linkedin.com"],
  },
  reddit: {
    platform: "reddit",
    displayName: "Reddit",
    description: "Community discussions and opinions",
    supportedMethods: ["oauth", "api_key"],
    requiredForPremium: false,
    domains: ["reddit.com", "old.reddit.com"],
  },
  bloomberg: {
    platform: "bloomberg",
    displayName: "Bloomberg",
    description: "Financial news and data",
    supportedMethods: ["cookie", "browser_session"],
    requiredForPremium: true,
    domains: ["bloomberg.com"],
  },
  reuters: {
    platform: "reuters",
    displayName: "Reuters",
    description: "Global news coverage",
    supportedMethods: ["cookie"],
    requiredForPremium: false,
    domains: ["reuters.com"],
  },
  medium: {
    platform: "medium",
    displayName: "Medium",
    description: "Articles and blog posts",
    supportedMethods: ["cookie"],
    requiredForPremium: false,
    domains: ["medium.com"],
  },
  substack: {
    platform: "substack",
    displayName: "Substack",
    description: "Newsletter content",
    supportedMethods: ["cookie"],
    requiredForPremium: false,
    domains: ["substack.com"],
  },
  custom: {
    platform: "custom",
    displayName: "Custom Source",
    description: "User-defined authentication",
    supportedMethods: ["cookie", "api_key", "browser_session"],
    requiredForPremium: false,
    domains: [],
  },
};
