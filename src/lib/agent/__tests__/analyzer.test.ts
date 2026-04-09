import { describe, it, expect, vi } from "vitest";
import { Analyzer } from "../analyzer.ts";

describe("Analyzer", () => {
    it("should analyze source content and return findings", async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: "Finding 1\nFinding 2"
      });
  
      const mockAi = { models: { generateContent: mockGenerateContent } } as any;
      const analyzer = new Analyzer(mockAi);
      const findings = await analyzer.analyze("Sample content", "What is X?", "Title X");
  
      expect(findings).toBe("Finding 1\nFinding 2");
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  
    it("should check completeness of findings", async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        text: JSON.stringify(true)
      });
  
      const mockAi = { models: { generateContent: mockGenerateContent } } as any;
      const analyzer = new Analyzer(mockAi);
      const isComplete = await analyzer.checkCompleteness("query", ["finding 1"]);
  
      expect(isComplete).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });
