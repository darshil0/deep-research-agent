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
      model: process.env.AGENT_MODEL || "gemini-2.0-flash-exp",
      contents: [{
        role: "user",
        parts: [{
          text: `You are a professional research synthesizer. Your task is to compile a comprehensive, high-quality research report based on the provided findings and citations.
      
      CRITICAL: Detect the language of the research query and respond ENTIRELY in that language.
      The summary, detailed analysis, and conclusion must all be in the detected language.

      ### Report Structure:
      - **Summary Field**: Provide a concise (1-2 paragraph) overview of the most critical research findings.
      - **Content Field (Markdown)**:
        1. **Detailed Analysis**: A structured section with clear headings and sub-headings (e.g., Technical Analysis, Market Impact, Key Players).
        2. **Conclusion**: A brief summary of the research's implications or future outlook.
        3. **Sources**: A mandatory section at the end listing all sources used, formatted as: [1] Title - URL.

      ### Citation Guidelines:
      - **Inline Citations**: Every factual claim, statistic, or specific finding **MUST** be followed by an inline citation in the format [1], [2], etc.
      - **Multiple Sources**: If a claim is supported by multiple sources, use [1, 2].
      - **Correspondence**: The numbers in the inline citations **MUST** correspond exactly to the index of the source in the provided citations list (starting from [1]).
      - **Completeness**: A mandatory '## Sources' section **MUST** be included at the end of the \`content\` field, listing all sources used in the format: [1] Title - URL.

      ### Guidelines:
      - **Tone**: Professional, objective, and analytical.
      - **Clarity**: Use clear, concise language.
      - **Markdown**: Use Markdown for the \`content\` field (headings, lists, bold text).
      - **Accuracy**: Only include information supported by the provided findings.

      ### Example Content Structure:
      ## Technical Analysis
      [Detailed content with inline citations like [1] or [2, 3]...]
      ## Market Impact
      [Detailed content with inline citations...]
      ## Conclusion
      [Conclusion content...]
      ## Sources
      [1] Source Title - https://example.com/source1
      [2] Another Source - https://example.com/source2

      ### Research Data:
      Research Query: ${query}
      Findings: ${findings.join("\n")}
      Citations: ${JSON.stringify(citations)}

      ### Output:
      Provide the report in the specified JSON format.`,
        }],
      }],
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
