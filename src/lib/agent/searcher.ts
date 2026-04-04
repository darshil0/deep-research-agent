import { GoogleGenAI, Type } from "@google/genai";
import { Citation, SearchFilters } from "./types.ts";
import { tavily } from "@tavily/core";
import { withRetry } from "../utils/retry.ts";
import { Fetcher } from "./fetcher.ts";

export class Searcher {
  private ai: GoogleGenAI;
  private tvly: any;
  private fetcher: Fetcher;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
    this.fetcher = new Fetcher();
    if (process.env.TAVILY_API_KEY) {
      this.tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    }
  }

  async searchAndFetch(query: string, plan: string[], previousFindings: string[], filters?: SearchFilters): Promise<{ sources: Citation[]; contents: { source: Citation; content: string }[] }> {
    const searchResults = await this.search(query, plan, previousFindings, filters);
    const topSources = searchResults.slice(0, 3);
    const contents: { source: Citation; content: string }[] = [];

    for (const source of topSources) {
      try {
        const content = await this.fetcher.fetch(source.url);
        if (content) {
          contents.push({ source, content });
        }
      } catch (err) {
        console.error(`Searcher: Failed to fetch ${source.url}:`, err);
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
