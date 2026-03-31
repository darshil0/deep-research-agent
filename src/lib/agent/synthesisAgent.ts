import { GoogleGenAI } from "@google/genai";
import { Synthesizer } from "./synthesizer.ts";
import { Citation, ResearchReport } from "./types.ts";

export class SynthesisAgent {
  private synthesizer: Synthesizer;

  constructor(ai: GoogleGenAI) {
    this.synthesizer = new Synthesizer(ai);
  }

  async synthesize(query: string, findings: string[], citations: Citation[]): Promise<Omit<ResearchReport, "metadata">> {
    return await this.synthesizer.synthesize(query, findings, citations);
  }
}
