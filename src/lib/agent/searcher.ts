import { GoogleGenAI, Type } from "@google/genai";
import { Citation } from "./types.ts";
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

  async search(query: string, plan: string[], previousFindings: string[]): Promise<Citation[]> {
    const combinedQuery = `Researching: ${query}\nContext: ${previousFindings.slice(-2).join("\n")}`;
    
    if (this.tvly) {
      try {
        const response = await withRetry(() => this.tvly.search(combinedQuery, {
          searchDepth: "advanced",
          maxResults: 5,
          includeAnswer: true,
        })) as any;

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
        model: "gemini-3-flash-preview",
        contents: `I am conducting deep research on: ${query}. 
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
