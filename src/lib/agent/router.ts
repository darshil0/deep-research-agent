import { GoogleGenAI } from "@google/genai";
import { Planner } from "./planner.ts";
import { Searcher } from "./searcher.ts";
import { Analyzer } from "./analyzer.ts";
import { Synthesizer } from "./synthesizer.ts";
import { Citation, ResearchReport, SearchFilters, SearchProviderType } from "./types.ts";

export type AgentRole = "planner" | "searcher" | "analyzer" | "synthesizer";

export class Router {
  private planner: Planner;
  private searcher: Searcher;
  private analyzer: Analyzer;
  private synthesizer: Synthesizer;
  private providerType: SearchProviderType;

  constructor(ai: GoogleGenAI, providerType: SearchProviderType = "tavily") {
    this.planner = new Planner(ai);
    this.searcher = new Searcher(ai, providerType);
    this.analyzer = new Analyzer(ai);
    this.synthesizer = new Synthesizer(ai);
    this.providerType = providerType;
  }

  async plan(query: string): Promise<string[]> {
    return await this.planner.createPlan(query);
  }

  async searchAndFetch(query: string, plan: string[], previousFindings: string[], filters?: SearchFilters) {
    return await this.searcher.searchAndFetch(query, plan, previousFindings, filters);
  }

  async analyze(content: string, query: string, sourceTitle: string): Promise<string> {
    return await this.analyzer.analyze(content, query, sourceTitle);
  }

  async checkCompleteness(query: string, findings: string[]): Promise<boolean> {
    return await this.analyzer.checkCompleteness(query, findings);
  }

  async synthesize(query: string, findings: string[], citations: Citation[]): Promise<Omit<ResearchReport, "metadata">> {
    return await this.synthesizer.synthesize(query, findings, citations);
  }
}
