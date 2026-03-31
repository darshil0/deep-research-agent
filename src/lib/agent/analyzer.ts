import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../utils/retry.ts";

export class Analyzer {
  private ai: GoogleGenAI;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
  }

  async analyze(content: string, query: string, sourceTitle: string): Promise<string> {
    const response = await withRetry(() => this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a research analyst. Extract the most relevant information from the following source content to answer the research query.
      Research Query: ${query}
      Source Title: ${sourceTitle}
      Source Content: ${content.substring(0, 5000)} // Limit content for analysis
      
      Please provide a concise, bulleted list of findings that are directly relevant to the research query.`,
      config: {
        responseMimeType: "text/plain",
      },
    }));

    return response.text || "";
  }

  async checkCompleteness(query: string, findings: string[]): Promise<boolean> {
    const response = await withRetry(() => this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the following research findings, do we have enough information to provide a comprehensive answer to the research query?
      Research Query: ${query}
      Findings: ${findings.join("\n")}
      
      Please answer with a boolean value: true if we have enough information, false otherwise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.BOOLEAN,
        },
      },
    }));

    try {
      const isComplete = JSON.parse(response.text || "false");
      return isComplete;
    } catch (err) {
      return false;
    }
  }
}
