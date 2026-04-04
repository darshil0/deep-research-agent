import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import { Citation, SearchFilters, SearchProviderType } from "./types.ts";
import { withRetry } from "../utils/retry.ts";
import { ContentCache } from "../utils/cache.ts";
import { SearchProvider, TavilySearchProvider, GoogleSearchProvider, HybridSearchProvider } from "./searchProviders.ts";

export class Searcher {
  private ai: GoogleGenAI;
  private provider: SearchProvider;
  private cache: ContentCache;

  constructor(ai: GoogleGenAI, providerType: SearchProviderType = "tavily") {
    this.ai = ai;
    this.cache = new ContentCache(24 * 60 * 60 * 1000);
    
    switch (providerType) {
      case "google":
        this.provider = new GoogleSearchProvider(ai);
        break;
      case "hybrid":
        this.provider = new HybridSearchProvider([
          new TavilySearchProvider(),
          new GoogleSearchProvider(ai)
        ]);
        break;
      case "tavily":
      default:
        this.provider = new TavilySearchProvider();
        break;
    }
  }

  private async fetchContent(url: string): Promise<string | null> {
    const cachedContent = await this.cache.get(url);
    if (cachedContent) return cachedContent;

    try {
      const content = await withRetry(async () => {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        const $ = cheerio.load(response.data);
        $("script, style, nav, footer, header, aside, iframe, noscript").remove();
        
        const text = $("article, main, .content, .post, .entry").text() || $("body").text();
        
        return text
          .replace(/\s+/g, " ")
          .replace(/\n+/g, "\n")
          .trim()
          .substring(0, 10000);
      }, 2);

      if (content) {
        await this.cache.set(url, content);
      }
      return content;
    } catch (err) {
      console.error(`Searcher: Failed to fetch ${url}:`, err);
      return null;
    }
  }

  async searchAndFetch(query: string, plan: string[], previousFindings: string[], filters?: SearchFilters): Promise<{ sources: Citation[]; contents: { source: Citation; content: string }[] }> {
    const searchResults = await this.search(query, plan, previousFindings, filters);
    const topSources = searchResults.slice(0, 3);
    const contents: { source: Citation; content: string }[] = [];

    for (const source of topSources) {
      try {
        const content = await this.fetchContent(source.url);
        if (content) {
          contents.push({ source, content });
        }
      } catch (err) {
        // Log handled in fetchContent
      }
    }

    return { sources: searchResults, contents };
  }

  async search(query: string, plan: string[], previousFindings: string[], filters?: SearchFilters): Promise<Citation[]> {
    const searchContext = previousFindings.slice(-3).join("\n");
    return await this.provider.search(query, searchContext, filters);
  }
}
