import axios from "axios";
import * as cheerio from "cheerio";
import { withRetry } from "../utils/retry.ts";
import { ContentCache } from "../utils/cache.ts";

export class Fetcher {
  private timeout: number;
  private maxRetries: number;
  private cache: ContentCache;

  constructor(timeout: number = 10000, maxRetries: number = 2, ttl: number = 24 * 60 * 60 * 1000) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.cache = new ContentCache(ttl);
  }

  async fetch(url: string): Promise<string | null> {
    // 1. Check cache first
    const cachedContent = await this.cache.get(url);
    if (cachedContent) {
      console.log(`Fetcher: Cache hit for ${url}`);
      return cachedContent;
    }

    // 2. Fetch if not in cache or expired
    try {
      const content = await withRetry(async () => {
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        const $ = cheerio.load(response.data);
        
        // Remove script, style, and other non-content elements
        $("script, style, nav, footer, header, aside, iframe, noscript").remove();
        
        // Extract text from main content areas
        const text = $("article, main, .content, .post, .entry").text() || $("body").text();
        
        // Clean up text
        return text
          .replace(/\s+/g, " ")
          .replace(/\n+/g, "\n")
          .trim()
          .substring(0, 10000); // Limit content size for analysis
      }, this.maxRetries);

      // 3. Update cache if successful
      if (content) {
        await this.cache.set(url, content);
      }

      return content;
    } catch (err) {
      console.error(`Failed to fetch ${url} after ${this.maxRetries} retries:`, err);
      return null;
    }
  }
}
