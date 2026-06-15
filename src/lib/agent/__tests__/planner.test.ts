import { describe, it, expect, vi } from "vitest";
import { Planner } from "../planner.ts";

describe("Planner", () => {
  it("should generate a research plan from a query", async () => {
    const mockText = vi.fn().mockReturnValue(JSON.stringify(["Sub-query 1", "Sub-query 2"]));
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: mockText },
    });
    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const mockAi = { getGenerativeModel: mockGetGenerativeModel } as any;

    const planner = new Planner(mockAi);
    const plan = await planner.createPlan("Tell me about quantum computing");

    expect(plan).toEqual(["Sub-query 1", "Sub-query 2"]);
    expect(mockGetGenerativeModel).toHaveBeenCalled();
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("should handle invalid JSON from AI by falling back to original query", async () => {
    const mockText = vi.fn().mockReturnValue("not json");
    const mockGenerateContent = vi.fn().mockResolvedValue({
      response: { text: mockText },
    });
    const mockGetGenerativeModel = vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    const mockAi = { getGenerativeModel: mockGetGenerativeModel } as any;
    const planner = new Planner(mockAi);

    const plan = await planner.createPlan("test");
    expect(plan).toEqual(["test"]);
  });
});
