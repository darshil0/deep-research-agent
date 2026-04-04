import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import * as cheerio from "cheerio";
import { Citation, SearchFilters } from "./types.ts";
import { tavily } from "@tavily/core";
import { withRetry } from "../utils/retry.ts";
import { ContentCache } from "../utils/cache.ts";

export class Searcher {
  private ai: GoogleGenAI;
  private tvly: any;
  private cache: ContentCache;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
    this.cache = new ContentCache(24 * 60 * 60 * 1000);
    if (process.env.TAVILY_API_KEY) {
      this.tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
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
    let combinedQuery = query;
    
    if (filters) {
      if (filters.domainRestriction) {
        combinedQuery += ` site:${filters.domainRestriction}`;
      }
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        combinedQuery += ` -${filters.excludeKeywords.join(" -")}`;
      }
    }

    const searchContext = `Researching: ${combinedQuery}\nContext: ${previousFindings.slice(-2).join("\n")}`;
    
    if (this.tvly) {
      try {
        const tavilyOptions: any = {
          searchDepth: "advanced",
          maxResults: 5,
          includeAnswer: true,
        };

        if (filters?.dateRange && filters.dateRange !== "all") {
          const daysMap: Record<string, number> = {
            day: 1,
            week: 7,
            month: 30,
            year: 365,
          };
          tavilyOptions.days = daysMap[filters.dateRange];
        }

        const response = await withRetry(() => this.tvly.search(searchContext, tavilyOptions)) as any;

        return response.results.map((r: any) => ({
          id: Math.random().toString(36).substring(7),
          url: r.url,
          title: r.title,
          snippet: r.content,
          relevance: r.score || 1,
        }));
      } catch (err) {
        console.error("Tavily search failed, falling back to Google Search:", err);
      }
    }

    // Fallback to Google Search Tool
    try {
      const response = await withRetry(() => this.ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `I am conducting deep research on: ${combinedQuery}. 
        Based on these sub-queries: ${plan.join(", ")}
        And these previous findings: ${previousFindings.slice(-3).join("\n")}
        
        Please find new, high-quality sources that provide deep insights.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      }));

      const citations: Citation[] = [];
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (groundingChunks) {
        for (const chunk of groundingChunks) {
          if (chunk.web) {
            citations.push({
              id: Math.random().toString(36).substring(7),
              url: chunk.web.uri || "",
              title: chunk.web.title || "",
              snippet: "",
              relevance: 1,
            });
          }
        }
      }

      return citations;
    } catch (err) {
      console.error("Google Search failed:", err);
      return [];
    }
  }
}
