import { z } from "zod";

export const ResearchStatus = z.enum(["idle", "planning", "searching", "fetching", "analyzing", "synthesizing", "completed", "failed"]);
export type ResearchStatus = z.infer<typeof ResearchStatus>;

export const ResearchStep = z.object({
  id: z.string(),
  type: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  message: z.string(),
  timestamp: z.string(),
  data: z.any().optional(),
});
export type ResearchStep = z.infer<typeof ResearchStep>;

export const Citation = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  snippet: z.string().optional(),
  relevance: z.number().optional(),
});
export type Citation = z.infer<typeof Citation>;

export const ResearchReport = z.object({
  query: z.string(),
  summary: z.string(),
  content: z.string(),
  citations: z.array(Citation),
  metadata: z.object({
    totalSteps: z.number(),
    totalTime: z.number(),
    totalCost: z.number().optional(),
  }),
});
export type ResearchReport = z.infer<typeof ResearchReport>;

export const ResearchConfig = z.object({
  maxIterations: z.number().default(5),
  maxTimeSeconds: z.number().default(300),
  budgetTokens: z.number().default(100000),
  useFullPageFetch: z.boolean().default(true),
});
export type ResearchConfig = z.infer<typeof ResearchConfig>;

export interface ResearchState {
  status: ResearchStatus;
  steps: ResearchStep[];
  report?: ResearchReport;
  error?: string;
}
