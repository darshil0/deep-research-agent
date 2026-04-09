import { describe, it, expect, vi } from "vitest";
import { Synthesizer } from "../synthesizer.ts";

describe("Synthesizer", () => {
    it("should synthesize findings into a report", async () => {
      const mockReport = {
        query: "test query",
        summary: "test summary",
        content: "test content",
        citations: []
      };
  
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify(mockReport)
      });
  
      const mockAi = { models: { generateContent: mockGenerateContent } } as any;
      const synthesizer = new Synthesizer(mockAi);
      const report = await synthesizer.synthesize("test query", ["finding 1"], []);
  
      expect(report.query).toBe(mockReport.query);
      expect(report.summary).toBe(mockReport.summary);
      expect(report.content).toBe(mockReport.content);
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });
