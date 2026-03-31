import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../utils/retry.ts";

export class Planner {
  private ai: GoogleGenAI;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
  }

  async createPlan(query: string): Promise<string[]> {
    const response = await withRetry(() => this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Break down the following research query into 3-5 specific, actionable research tasks or sub-queries that will help provide a comprehensive answer.
      Query: ${query}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A specific research sub-query.",
          },
        },
      },
    }));

    try {
      const plan = JSON.parse(response.text || "[]");
      return plan;
    } catch (err) {
      console.error("Failed to parse planner response:", response.text);
      return [query]; // Fallback to original query
    }
  }
}
