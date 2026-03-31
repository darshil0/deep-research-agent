import { GoogleGenAI } from "@google/genai";
import { ResearchConfig, ResearchState, ResearchStep, ResearchReport, Citation } from "./types.ts";
import { Router } from "./router.ts";
import fs from "fs/promises";
import path from "path";

export class ResearchOrchestrator {
  private query: string;
  private config: ResearchConfig;
  private onUpdate: (state: ResearchState) => void;
  private state: ResearchState;
  private ai: GoogleGenAI;
  private taskId: string;
  private router: Router;

  constructor(query: string, config: ResearchConfig, onUpdate: (state: ResearchState) => void) {
    this.query = query;
    this.config = config;
    this.onUpdate = onUpdate;
    this.taskId = Math.random().toString(36).substring(7);
    this.state = {
      status: "idle",
      steps: [],
    };
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please provide a valid API key in the environment variables.");
    }
    
    this.ai = new GoogleGenAI({ apiKey });
    this.router = new Router(this.ai);
  }

  private async persist() {
    try {
      const dir = path.join(process.cwd(), "research_results");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, `${this.taskId}.json`),
        JSON.stringify(this.state, null, 2)
      );
    } catch (err) {
      console.error("Failed to persist research state:", err);
    }
  }

  private updateState(update: Partial<ResearchState>) {
    this.state = { ...this.state, ...update };
    this.onUpdate(this.state);
    this.persist();
  }

  private addStep(type: string, message: string, data?: any) {
    const step: ResearchStep = {
      id: Math.random().toString(36).substring(7),
      type,
      status: "running",
      message,
      timestamp: new Date().toISOString(),
      data,
    };
    this.state.steps.push(step);
    this.updateState({ steps: [...this.state.steps] });
    return step.id;
  }

  private completeStep(id: string, status: "completed" | "failed", message?: string, data?: any) {
    const stepIndex = this.state.steps.findIndex((s) => s.id === id);
    if (stepIndex !== -1) {
      this.state.steps[stepIndex] = {
        ...this.state.steps[stepIndex],
        status,
        message: message || this.state.steps[stepIndex].message,
        data: data || this.state.steps[stepIndex].data,
      };
      this.updateState({ steps: [...this.state.steps] });
    }
  }

  async run() {
    const startTime = Date.now();
    this.updateState({ status: "planning" });

    try {
      // 1. Planning Phase
      const plan = await this.planPhase();

      // 2. Iterative Research Phase
      const { allFindings, allCitations } = await this.researchPhase(plan, startTime);

      // 3. Synthesis Phase
      await this.synthesisPhase(allFindings, allCitations, startTime);

    } catch (err: any) {
      this.updateState({ status: "failed", error: err.message });
      throw err;
    }
  }

  private async planPhase(): Promise<string[]> {
    const plannerId = this.addStep("planning", "Breaking down query into research tasks...");
    const plan = await this.router.plan(this.query);
    this.completeStep(plannerId, "completed", "Research plan created.", plan);
    return plan;
  }

  private async researchPhase(plan: string[], startTime: number): Promise<{ allFindings: string[], allCitations: Citation[] }> {
    let allCitations: Citation[] = [];
    let allFindings: string[] = [];
    let iterations = 0;

    while (iterations < this.config.maxIterations) {
      iterations++;
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > this.config.maxTimeSeconds) {
        this.addStep("system", "Time limit reached, synthesizing findings...");
        break;
      }

      this.updateState({ status: "searching" });
      const searchId = this.addStep("searching", `Iteration ${iterations}: Searching for information...`);
      
      // Context Pruning: Only pass the most recent findings to the searcher
      const recentFindings = allFindings.slice(-5);
      const { sources, contents } = await this.router.searchAndFetch(this.query, plan, recentFindings, this.config.filters);
      this.completeStep(searchId, "completed", `Found ${sources.length} relevant sources.`, sources);

      // Analysis
      this.updateState({ status: "fetching" });
      const analysisId = this.addStep("fetching", `Iteration ${iterations}: Analyzing content for top sources...`);

      for (const { source, content } of contents) {
        if (allCitations.some(c => c.url === source.url)) continue; // Skip duplicates

        try {
          const findings = await this.router.analyze(content, this.query, source.title);
          allFindings.push(findings);
          allCitations.push(source);
        } catch (err) {
          console.error(`Failed to analyze ${source.url}:`, err);
        }
      }
      this.completeStep(analysisId, "completed", `Analyzed ${contents.length} sources.`);

      // Check if we have enough information
      const isComplete = await this.router.checkCompleteness(this.query, allFindings);
      if (isComplete) {
        this.addStep("system", "Sufficient information gathered.");
        break;
      }
    }

    return { allFindings, allCitations };
  }

  private async synthesisPhase(allFindings: string[], allCitations: Citation[], startTime: number) {
    this.updateState({ status: "synthesizing" });
    const synthId = this.addStep("synthesizing", "Synthesizing final report with citations...");
    const report = await this.router.synthesize(this.query, allFindings, allCitations);
    
    const totalTime = (Date.now() - startTime) / 1000;
    const finalReport: ResearchReport = {
      ...report,
      metadata: {
        totalSteps: this.state.steps.length,
        totalTime,
      },
    };

    this.completeStep(synthId, "completed", "Report generated successfully.");
    this.updateState({ status: "completed", report: finalReport });
  }
}
