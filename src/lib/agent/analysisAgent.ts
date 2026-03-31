import { GoogleGenAI } from "@google/genai";
import { Analyzer } from "./analyzer.ts";

export class AnalysisAgent {
  private analyzer: Analyzer;

  constructor(ai: GoogleGenAI) {
    this.analyzer = new Analyzer(ai);
  }

  async analyze(content: string, query: string, sourceTitle: string): Promise<string> {
    return await this.analyzer.analyze(content, query, sourceTitle);
  }

  async checkCompleteness(query: string, findings: string[]): Promise<boolean> {
    return await this.analyzer.checkCompleteness(query, findings);
  }
}
