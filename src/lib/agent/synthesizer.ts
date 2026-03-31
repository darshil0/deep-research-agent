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
      contents: `You are a professional research synthesizer. Your task is to compile a comprehensive, high-quality research report based on the provided findings and citations.

      ### Report Structure:
      1. **Executive Summary**: A concise (1-2 paragraph) overview of the most critical research findings.
      2. **Detailed Analysis**: A structured section with clear headings and sub-headings (e.g., Technical Analysis, Market Impact, Key Players).
      3. **Conclusion**: A brief summary of the research's implications or future outlook.
      4. **Citations**: Ensure every factual claim is supported by a citation in the format [1], [2], etc., corresponding to the provided citations list.

      ### Guidelines:
      - **Tone**: Professional, objective, and analytical.
      - **Clarity**: Use clear, concise language.
      - **Markdown**: Use Markdown for the \`content\` field (headings, lists, bold text).
      - **Accuracy**: Only include information supported by the provided findings.

      ### Example Report Structure:
      # Research Report: [Topic]
      ## Executive Summary
      [Summary content...]
      ## Technical Analysis
      [Detailed content with citations [1]...]
      ## Market Impact
      [Detailed content with citations [2]...]
      ## Conclusion
      [Conclusion content...]

      ### Research Data:
      Research Query: ${query}
      Findings: ${findings.join("\n")}
      Citations: ${JSON.stringify(citations)}

      ### Output:
      Provide the report in the specified JSON format.`,
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
