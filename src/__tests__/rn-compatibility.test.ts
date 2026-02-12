/**
 * React Native Compatibility Tests
 *
 * Verifies that the deep-research package does not depend on
 * Node-specific built-in modules and can safely run in a
 * React Native (or any non-Node) JavaScript environment.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// 1. No Node-specific imports in main entry (src/index.ts transitive sources)
// ---------------------------------------------------------------------------

const NODE_BUILTINS = [
  "fs",
  "path",
  "os",
  "child_process",
  "net",
  "tls",
  "http",
  "https",
  "cluster",
  "dgram",
  "dns",
  "readline",
  "repl",
  "tty",
  "vm",
  "v8",
  "perf_hooks",
  "worker_threads",
];

/** Recursively collect .ts source files under a directory, skipping tests and cli */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "__tests__" && entry.name !== "node_modules") {
      results.push(...collectSourceFiles(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts") &&
      entry.name !== "cli.ts"
    ) {
      results.push(full);
    }
  }
  return results;
}

describe("React Native compatibility", () => {
  const srcDir = path.resolve(__dirname, "..");
  const sourceFiles = collectSourceFiles(srcDir);

  describe("no Node-specific imports in library source", () => {
    // Build a single regex that matches: import ... from "node:fs" / "fs" / require("fs") etc.
    const patterns = NODE_BUILTINS.flatMap((mod) => [
      new RegExp(`from\\s+["'](?:node:)?${mod}(?:/[^"']*)?["']`),
      new RegExp(`require\\s*\\(\\s*["'](?:node:)?${mod}(?:/[^"']*)?["']\\s*\\)`),
    ]);

    it("should have source files to check", () => {
      expect(sourceFiles.length).toBeGreaterThan(0);
    });

    it.each(sourceFiles)("file %s has no Node-only imports", (file) => {
      const content = fs.readFileSync(file, "utf-8");
      for (const pat of patterns) {
        expect(content).not.toMatch(pat);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Adapter classes are importable and constructible
  // ---------------------------------------------------------------------------

  describe("adapters are importable", () => {
    it("LightweightScraperAdapter exists and is a class", async () => {
      const mod = await import("../adapters/index.js");
      expect(mod.LightweightScraperAdapter).toBeDefined();
      expect(typeof mod.LightweightScraperAdapter).toBe("function");
    });

    it("DeepSearchAdapter exists and is a class", async () => {
      const mod = await import("../adapters/index.js");
      expect(mod.DeepSearchAdapter).toBeDefined();
      expect(typeof mod.DeepSearchAdapter).toBe("function");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Domain schemas are importable
  // ---------------------------------------------------------------------------

  describe("domain schemas are importable", () => {
    it("exports ResearchQuerySchema", async () => {
      const mod = await import("../domain/index.js");
      expect(mod.ResearchQuerySchema).toBeDefined();
      expect(typeof mod.ResearchQuerySchema.parse).toBe("function");
    });

    it("exports ResearchResultSchema", async () => {
      const mod = await import("../domain/index.js");
      expect(mod.ResearchResultSchema).toBeDefined();
      expect(typeof mod.ResearchResultSchema.parse).toBe("function");
    });

    it("exports EffortLevelSchema", async () => {
      const mod = await import("../domain/index.js");
      expect(mod.EffortLevelSchema).toBeDefined();
      expect(typeof mod.EffortLevelSchema.parse).toBe("function");
    });

    it("exports SourceSchema", async () => {
      const mod = await import("../domain/index.js");
      expect(mod.SourceSchema).toBeDefined();
      expect(typeof mod.SourceSchema.parse).toBe("function");
    });

    it("exports ResearchEventSchema", async () => {
      const mod = await import("../domain/index.js");
      expect(mod.ResearchEventSchema).toBeDefined();
      expect(typeof mod.ResearchEventSchema.parse).toBe("function");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. CLI module is NOT re-exported from src/index.ts
  // ---------------------------------------------------------------------------

  describe("CLI is not part of the library surface", () => {
    it("src/index.ts does not re-export cli.ts", () => {
      const indexContent = fs.readFileSync(
        path.resolve(srcDir, "index.ts"),
        "utf-8",
      );
      expect(indexContent).not.toMatch(/from\s+["']\.\/cli/);
      expect(indexContent).not.toMatch(/export\s.*from\s+["']\.\/cli/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Platform-agnostic dependencies are importable
  // ---------------------------------------------------------------------------

  describe("platform-agnostic dependencies", () => {
    it("p-limit is importable", async () => {
      const mod = await import("p-limit");
      expect(mod.default ?? mod).toBeDefined();
    });

    it("lru-cache is importable", async () => {
      const { LRUCache } = await import("lru-cache");
      expect(LRUCache).toBeDefined();
      expect(typeof LRUCache).toBe("function");
    });

    it("uuid is importable", async () => {
      const mod = await import("uuid");
      expect(mod.v4).toBeDefined();
      expect(typeof mod.v4).toBe("function");
    });
  });
});
