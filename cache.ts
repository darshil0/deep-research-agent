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

  constructor(ttl: number = 24 * 60 * 60 * 1000) { // Default 24 hours
    this.cacheDir = path.join(process.cwd(), "research_results", "cache");
    this.ttl = ttl;
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (err) {
      console.error("Failed to create cache directory:", err);
    }
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
      
      // Expired - delete the file
      try {
        await fs.unlink(cachePath);
      } catch {
        // Ignore unlink errors
      }
      
      return null;
    } catch (err) {
      // Cache miss or read error
      return null;
    }
  }

  async set(url: string, content: string): Promise<void> {
    try {
      await this.ensureCacheDir();
      const cachePath = this.getCachePath(url);
      const entry: CacheEntry = {
        url,
        content,
        timestamp: Date.now(),
      };
      await fs.writeFile(cachePath, JSON.stringify(entry, null, 2), "utf-8");
    } catch (err) {
      console.error(`Failed to write to cache for ${url}:`, err);
    }
  }

  async clear(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await this.ensureCacheDir();
      console.log("Cache cleared successfully");
    } catch (err) {
      console.error("Failed to clear cache:", err);
      throw err;
    }
  }

  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        try {
          const stats = await fs.stat(path.join(this.cacheDir, file));
          totalSize += stats.size;
        } catch {
          // Skip files that can't be read
        }
      }
      
      return { count: files.length, totalSize };
    } catch {
      return { count: 0, totalSize: 0 };
    }
  }
}
