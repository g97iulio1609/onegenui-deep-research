/**
 * Cookie Auth Adapter
 *
 * Manages cookie-based authentication for platforms that require login
 * Supports importing cookies from browser exports
 */
import type { CookieAuthPort } from "../ports/auth.port";
import type { CookieCredential } from "../domain/auth.schema";

// LRU cache for cookie storage
const cookieStore = new Map<string, CookieCredential>();

export class CookieAuthAdapter implements CookieAuthPort {
  /**
   * Import cookies from Netscape format (common browser export)
   * Format: domain\tinclude_subdomains\tpath\tsecure\texpires\tname\tvalue
   */
  async importFromNetscapeFormat(
    cookieFile: string,
  ): Promise<CookieCredential> {
    const lines = cookieFile.split("\n").filter((l) => l && !l.startsWith("#"));
    const cookies: CookieCredential["cookies"] = [];

    let domain = "";
    for (const line of lines) {
      const parts = line.split("\t");
      if (parts.length >= 7) {
        const [cookieDomain, , path, secure, expires, name, value] = parts;
        if (!domain) domain = cookieDomain!.replace(/^\./, "");

        cookies.push({
          name: name!,
          value: value!,
          domain: cookieDomain!,
          path: path || "/",
          expires: expires ? parseInt(expires, 10) : undefined,
          secure: secure === "TRUE",
        });
      }
    }

    const credential: CookieCredential = { domain, cookies };
    cookieStore.set(domain, credential);
    return credential;
  }

  /**
   * Import cookies from JSON format
   */
  async importFromJson(cookieJson: string): Promise<CookieCredential> {
    const parsed = JSON.parse(cookieJson);

    // Handle array of cookies or object with cookies array
    const cookiesArray = Array.isArray(parsed) ? parsed : parsed.cookies || [];
    const domain =
      parsed.domain || (cookiesArray[0]?.domain || "").replace(/^\./, "");

    const cookies: CookieCredential["cookies"] = cookiesArray.map(
      (c: Record<string, unknown>) => ({
        name: String(c.name || ""),
        value: String(c.value || ""),
        domain: String(c.domain || domain),
        path: String(c.path || "/"),
        expires: typeof c.expires === "number" ? c.expires : undefined,
        httpOnly: Boolean(c.httpOnly),
        secure: Boolean(c.secure),
        sameSite: c.sameSite as "Strict" | "Lax" | "None" | undefined,
      }),
    );

    const credential: CookieCredential = { domain, cookies };
    cookieStore.set(domain, credential);
    return credential;
  }

  /**
   * Get cookie header string for a domain
   */
  async getCookieHeader(domain: string): Promise<string | null> {
    // Try exact match first
    let credential = cookieStore.get(domain);

    // Try parent domains
    if (!credential) {
      const parts = domain.split(".");
      for (let i = 1; i < parts.length; i++) {
        const parentDomain = parts.slice(i).join(".");
        credential = cookieStore.get(parentDomain);
        if (credential) break;
      }
    }

    if (!credential) return null;

    const now = Date.now() / 1000;
    const validCookies = credential.cookies.filter(
      (c) => !c.expires || c.expires > now,
    );

    if (validCookies.length === 0) return null;

    return validCookies.map((c) => `${c.name}=${c.value}`).join("; ");
  }

  /**
   * Validate cookies are still valid for a domain
   */
  async validateCookies(domain: string): Promise<boolean> {
    const header = await this.getCookieHeader(domain);
    return header !== null && header.length > 0;
  }

  /**
   * Store credentials directly
   */
  storeCredential(credential: CookieCredential): void {
    cookieStore.set(credential.domain, credential);
  }

  /**
   * Remove credentials for a domain
   */
  removeCredential(domain: string): void {
    cookieStore.delete(domain);
  }

  /**
   * List all stored domains
   */
  listDomains(): string[] {
    return Array.from(cookieStore.keys());
  }
}
