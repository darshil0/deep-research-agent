import { describe, it, expect, vi } from "vitest";
import { Analyzer } from "../analyzer.ts";

describe("Analyzer", () => {
  it("should analyze source content and return findings", async () => {
    const mockText = vi.fn().mockReturnValue("Finding 1\nFinding 2");
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: mockText },
    });
    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const mockAi = { getGenerativeModel: mockGetGenerativeModel } as any;
    const analyzer = new Analyzer(mockAi);
    const findings = await analyzer.analyze("Sample content", "What is X?", "Title X");

    expect(findings).toBe("Finding 1\nFinding 2");
    expect(mockGetGenerativeModel).toHaveBeenCalled();
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("should check completeness of findings", async () => {
    const mockText = vi.fn().mockReturnValue(JSON.stringify(true));
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: mockText },
    });
    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const mockAi = { getGenerativeModel: mockGetGenerativeModel } as any;
    const analyzer = new Analyzer(mockAi);
    const isComplete = await analyzer.checkCompleteness("query", ["finding 1"]);

    expect(isComplete).toBe(true);
    expect(mockGetGenerativeModel).toHaveBeenCalled();
    expect(mockGenerateContent).toHaveBeenCalled();
  });
});
