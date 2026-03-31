import axios from "axios";
import * as cheerio from "cheerio";

export class Fetcher {
  private timeout: number;
  private maxRetries: number;

  constructor(timeout: number = 10000, maxRetries: number = 2) {
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  async fetch(url: string): Promise<string | null> {
    let retries = 0;
    while (retries <= this.maxRetries) {
      try {
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
        const content = $("article, main, .content, .post, .entry").text() || $("body").text();
        
        // Clean up text
        return content
          .replace(/\s+/g, " ")
          .replace(/\n+/g, "\n")
          .trim()
          .substring(0, 10000); // Limit content size for analysis

      } catch (err) {
        retries++;
        if (retries > this.maxRetries) {
          console.error(`Failed to fetch ${url} after ${this.maxRetries} retries:`, err);
          return null;
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    return null;
  }
}
