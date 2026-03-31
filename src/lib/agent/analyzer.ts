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
      contents: `You are a senior research analyst. Your task is to extract high-quality, evidence-based findings from the provided source content that directly address the research query.

      ### Instructions:
      - **Be Specific**: Include exact numbers, dates, names, and technical details.
      - **Stay Objective**: Report facts as stated in the source without adding personal interpretation.
      - **Format**: Use a concise, bulleted list.
      - **Relevance**: Only include information that is directly relevant to the research query.

      ### Example:
      Research Query: "Market share of electric vehicles in 2023"
      Source Content: "...Global EV sales reached 14 million units in 2023, representing 18% of all new car sales. Tesla remained the leader with a 19.1% share, followed by BYD at 16.5%..."
      Findings:
      - Global EV sales reached 14 million units in 2023.
      - EVs accounted for 18% of all new car sales globally in 2023.
      - Tesla held a 19.1% global market share in 2023.
      - BYD followed Tesla with a 16.5% global market share in 2023.

      ### Research Task:
      Research Query: ${query}
      Source Title: ${sourceTitle}
      Source Content: ${content.substring(0, 5000)}

      ### Findings:`,
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
