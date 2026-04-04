import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface CacheEntry {
  url: string;
  content: string;
  timestamp: number;
}

export class ContentCache {
  private cacheDir: string;
  private ttl: number; // TTL in milliseconds

  constructor(ttl?: number) {
    this.cacheDir = path.join(process.cwd(), "research_results", "cache");
    const envTtl = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) * 1000 : null;
    this.ttl = ttl ?? envTtl ?? 24 * 60 * 60 * 1000;
  }

  private getCachePath(url: string): string {
    const hash = crypto.createHash("md5").update(url).digest("hex");
    return path.join(this.cacheDir, `${hash}.json`);
  }

  async get(url: string): Promise<string | null> {
    try {
      const cachePath = this.getCachePath(url);
      const data = await fs.readFile(cachePath, "utf-8");
      const entry: CacheEntry = JSON.parse(data);

      const now = Date.now();
      if (now - entry.timestamp < this.ttl) {
        return entry.content;
      }
      
      // Expired
      return null;
    } catch (err) {
      // Cache miss or read error
      return null;
    }
  }

  async set(url: string, content: string): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const cachePath = this.getCachePath(url);
      const entry: CacheEntry = {
        url,
        content,
        timestamp: Date.now(),
      };
      await fs.writeFile(cachePath, JSON.stringify(entry, null, 2));
    } catch (err) {
      console.error(`Failed to write to cache for ${url}:`, err);
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  }
}
