import { describe, it, expect, vi } from "vitest";
import { Planner } from "../planner.ts";

describe("Planner", () => {
  it("should generate a research plan from a query", async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify(["Sub-query 1", "Sub-query 2"])
    });

    const mockAi = {
      models: {
        generateContent: mockGenerateContent
      }
    } as any;

    const planner = new Planner(mockAi);
    const plan = await planner.createPlan("Tell me about quantum computing");

    expect(plan).toEqual(["Sub-query 1", "Sub-query 2"]);
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("should handle invalid JSON from AI by falling back to original query", async () => {
     const mockGenerateContent = vi.fn().mockResolvedValue({
      text: "not json"
    });

    const mockAi = { models: { generateContent: mockGenerateContent } } as any;
    const planner = new Planner(mockAi);
    
    const plan = await planner.createPlan("test");
    expect(plan).toEqual(["test"]);
  });
});
