import { GoogleGenAI } from "@google/genai";
import { Citation } from "./types.ts";
import { Searcher } from "./searcher.ts";
import { Fetcher } from "./fetcher.ts";

export class SearchAgent {
  private searcher: Searcher;
  private fetcher: Fetcher;

  constructor(ai: GoogleGenAI) {
    this.searcher = new Searcher(ai);
    this.fetcher = new Fetcher();
  }

  async execute(query: string, plan: string[], previousFindings: string[]): Promise<{ sources: Citation[]; contents: { source: Citation; content: string }[] }> {
    // 1. Search for relevant sources
    const searchResults = await this.searcher.search(query, plan, previousFindings);
    
    // 2. Fetch content for top sources
    const topSources = searchResults.slice(0, 3);
    const contents: { source: Citation; content: string }[] = [];

    for (const source of topSources) {
      try {
        const content = await this.fetcher.fetch(source.url);
        if (content) {
          contents.push({ source, content });
        }
      } catch (err) {
        console.error(`SearchAgent: Failed to fetch ${source.url}:`, err);
      }
    }

    return { sources: searchResults, contents };
  }
}
