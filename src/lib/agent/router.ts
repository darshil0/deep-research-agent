import { GoogleGenAI } from "@google/genai";
import { Planner } from "./planner.ts";
import { SearchAgent } from "./searchAgent.ts";
import { AnalysisAgent } from "./analysisAgent.ts";
import { SynthesisAgent } from "./synthesisAgent.ts";
import { Citation, ResearchReport, SearchFilters } from "./types.ts";

export type AgentRole = "planner" | "searcher" | "analyzer" | "synthesizer";

export class Router {
  private planner: Planner;
  private searchAgent: SearchAgent;
  private analysisAgent: AnalysisAgent;
  private synthesisAgent: SynthesisAgent;

  constructor(ai: GoogleGenAI) {
    this.planner = new Planner(ai);
    this.searchAgent = new SearchAgent(ai);
    this.analysisAgent = new AnalysisAgent(ai);
    this.synthesisAgent = new SynthesisAgent(ai);
  }

  async plan(query: string): Promise<string[]> {
    return await this.planner.createPlan(query);
  }

  async searchAndFetch(query: string, plan: string[], previousFindings: string[], filters?: SearchFilters) {
    return await this.searchAgent.execute(query, plan, previousFindings, filters);
  }

  async analyze(content: string, query: string, sourceTitle: string): Promise<string> {
    return await this.analysisAgent.analyze(content, query, sourceTitle);
  }

  async checkCompleteness(query: string, findings: string[]): Promise<boolean> {
    return await this.analysisAgent.checkCompleteness(query, findings);
  }

  async synthesize(query: string, findings: string[], citations: Citation[]): Promise<Omit<ResearchReport, "metadata">> {
    return await this.synthesisAgent.synthesize(query, findings, citations);
  }
}
