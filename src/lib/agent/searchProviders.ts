import { GoogleGenAI } from "@google/genai";
import { tavily } from "@tavily/core";
import { Citation, SearchFilters } from "./types.ts";
import { withRetry } from "../utils/retry.ts";

export interface SearchProvider {
  search(query: string, context: string, filters?: SearchFilters): Promise<Citation[]>;
}

export class TavilySearchProvider implements SearchProvider {
  private tvly: any;

  constructor() {
    if (process.env.TAVILY_API_KEY) {
      this.tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    }
  }

  async search(query: string, context: string, filters?: SearchFilters): Promise<Citation[]> {
    if (!this.tvly) {
      throw new Error("Tavily API key not configured");
    }

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

    const searchContext = `${query}\nContext: ${context}`;
    const response = await withRetry(() => this.tvly.search(searchContext, tavilyOptions)) as any;

    return response.results.map((r: any) => ({
      id: Math.random().toString(36).substring(7),
      url: r.url,
      title: r.title,
      snippet: r.content,
      relevance: r.score || 1,
    }));
  }
}

export class GoogleSearchProvider implements SearchProvider {
  private ai: GoogleGenAI;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
  }

  async search(query: string, context: string, filters?: SearchFilters): Promise<Citation[]> {
    let combinedQuery = query;
    if (filters) {
      if (filters.domainRestriction) {
        combinedQuery += ` site:${filters.domainRestriction}`;
      }
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        combinedQuery += ` -${filters.excludeKeywords.join(" -")}`;
      }
    }

    const response = await withRetry(() => this.ai.models.generateContent({
      model: process.env.AGENT_MODEL || "gemini-2.0-flash-exp",
      contents: `Search Query: ${combinedQuery}\nContext: ${context}\n\nPlease find relevant high-quality sources.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    }));

    const citations: Citation[] = [];
    const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
    
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
  }
}

export class HybridSearchProvider implements SearchProvider {
  private providers: SearchProvider[];

  constructor(providers: SearchProvider[]) {
    this.providers = providers;
  }

  async search(query: string, context: string, filters?: SearchFilters): Promise<Citation[]> {
    const results = await Promise.all(this.providers.map(p => p.search(query, context, filters).catch(e => {
      console.error("Provider search failed:", e);
      return [];
    })));
    
    // Merge and deduplicate by URL
    const merged = new Map<string, Citation>();
    for (const providerResults of results) {
      for (const res of providerResults) {
        if (!merged.has(res.url)) {
          merged.set(res.url, res);
        }
      }
    }
    
    return Array.from(merged.values());
  }
}
