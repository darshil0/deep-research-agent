import { GoogleGenAI, Type } from "@google/genai";
import { Citation, SearchFilters } from "./types.ts";
import { tavily } from "@tavily/core";
import { withRetry } from "../utils/retry.ts";

export class Searcher {
  private ai: GoogleGenAI;
  private tvly: any;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
    if (process.env.TAVILY_API_KEY) {
      this.tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    }
  }

  async search(query: string, plan: string[], previousFindings: string[], filters?: SearchFilters): Promise<Citation[]> {
    let combinedQuery = query;
    
    // Apply filters to query
    if (filters) {
      if (filters.domainRestriction) {
        combinedQuery += ` site:${filters.domainRestriction}`;
      }
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        combinedQuery += ` ${filters.excludeKeywords.map(k => `-${k}`).join(" ")}`;
      }
    }

    const searchContext = `Researching: ${combinedQuery}\nContext: ${previousFindings.slice(-2).join("\n")}`;
    
    // Try Tavily first if available
    if (this.tvly) {
      try {
        const tavilyOptions: any = {
          searchDepth: "advanced",
          maxResults: 5,
          includeAnswer: true,
        };

        // Apply date range filter using Tavily's native parameter
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

        if (response?.results && Array.isArray(response.results)) {
          return response.results.map((r: any) => ({
            id: Math.random().toString(36).substring(7),
            url: r.url,
            title: r.title,
            snippet: r.content || "",
            relevance: r.score || 1,
          }));
        }
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
      
      if (groundingChunks && Array.isArray(groundingChunks)) {
        for (const chunk of groundingChunks) {
          if (chunk.web) {
            citations.push({
              id: Math.random().toString(36).substring(7),
              url: chunk.web.uri || "",
              title: chunk.web.title || "Untitled Source",
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
