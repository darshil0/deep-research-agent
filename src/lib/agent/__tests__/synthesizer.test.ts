import { describe, it, expect, vi } from "vitest";
import { Synthesizer } from "../synthesizer.ts";

describe("Synthesizer", () => {
  it("should synthesize findings into a report", async () => {
    const mockReport = {
      query: "test query",
      summary: "test summary",
      content: "test content",
      citations: [],
    };

    const mockText = vi.fn().mockReturnValue(JSON.stringify(mockReport));
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: mockText },
    });
    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const mockAi = { getGenerativeModel: mockGetGenerativeModel } as any;
    const synthesizer = new Synthesizer(mockAi);
    const report = await synthesizer.synthesize("test query", ["finding 1"], []);

    expect(report.query).toBe(mockReport.query);
    expect(report.summary).toBe(mockReport.summary);
    expect(report.content).toBe(mockReport.content);
    expect(mockGetGenerativeModel).toHaveBeenCalled();
    expect(mockGenerateContent).toHaveBeenCalled();
  });
});
