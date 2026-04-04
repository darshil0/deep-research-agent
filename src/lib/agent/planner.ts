import { GoogleGenAI, Type } from "@google/genai";
import { withRetry } from "../utils/retry.ts";

export class Planner {
  private ai: GoogleGenAI;

  constructor(ai: GoogleGenAI) {
    this.ai = ai;
  }

  async createPlan(query: string): Promise<string[]> {
    const response = await withRetry(() => this.ai.models.generateContent({
      model: process.env.AGENT_MODEL || "gemini-2.0-flash-exp",
      contents: `You are a research planning expert. Your task is to decompose a complex research query into 3-5 specific, actionable, and distinct sub-queries. 
      
      CRITICAL: Detect the language of the query and respond ENTIRELY in that language.
      All sub-queries and the analysis plan must be in the detected language.
      
      Each sub-query should target a different dimension of the main topic (e.g., technical specifications, market trends, key competitors, historical context, or future outlook).

      ### Guidelines:
      - Ensure sub-queries are specific enough to yield high-quality search results.
      - Avoid overlapping sub-queries.
      - Use professional research terminology.

      ### Example:
      Query: "The impact of solid-state batteries on the EV industry"
      Plan: [
        "Current state of solid-state battery technology and key technical challenges",
        "Major companies and startups leading solid-state battery development",
        "Comparison of energy density and safety between solid-state and lithium-ion batteries",
        "Projected timeline for mass production and commercial adoption in EVs",
        "Impact of solid-state batteries on EV range, charging speed, and overall market growth"
      ]

      ### Query to Decompose:
      ${query}`,
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
