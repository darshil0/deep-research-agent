import { GoogleGenAI, Type } from "@google/genai";
import { Citation, ResearchReport } from "./types.ts";
import { withRetry } from "../utils/retry.ts";

export class Synthesizer {
  private ai: GoogleGenAI;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
  }

  async synthesize(query: string, findings: string[], citations: Citation[]): Promise<Omit<ResearchReport, "metadata">> {
    const response = await withRetry(() => this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a research synthesizer. Compile a comprehensive, high-quality research report based on the following findings and citations.
      Research Query: ${query}
      Findings: ${findings.join("\n")}
      Citations: ${JSON.stringify(citations)}
      
      The report should include:
      1. A concise summary of the research findings.
      2. A detailed content section with clear headings and sub-headings.
      3. Clear citations for every claim made in the report. Use [1], [2], etc. to reference the citations.
      
      Please provide the report in a structured JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
            summary: { type: Type.STRING },
            content: { type: Type.STRING, description: "Detailed research report in Markdown format." },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  url: { type: Type.STRING },
                  title: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                },
                required: ["id", "url", "title"],
              },
            },
          },
          required: ["query", "summary", "content", "citations"],
        },
      },
    }));

    try {
      const report = JSON.parse(response.text || "{}");
      return report;
    } catch (err) {
      console.error("Failed to parse synthesizer response:", response.text);
      return {
        query,
        summary: "Failed to synthesize report.",
        content: "An error occurred during synthesis.",
        citations: [],
      };
    }
  }
}
