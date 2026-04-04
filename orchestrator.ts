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

  private async persist(): Promise<void> {
    try {
      const dir = path.join(process.cwd(), "research_results");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, `${this.taskId}.json`),
        JSON.stringify(this.state, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("Failed to persist research state:", err);
    }
  }

  private updateState(update: Partial<ResearchState>): void {
    this.state = { ...this.state, ...update };
    this.onUpdate(this.state);
    this.persist().catch(err => console.error("Persistence error:", err));
  }

  private addStep(type: string, message: string, data?: any): string {
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

  private completeStep(id: string, status: "completed" | "failed", message?: string, data?: any): void {
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

  async run(): Promise<void> {
    const startTime = Date.now();
    this.updateState({ status: "planning" });

    try {
      // 1. Planning Phase
      const plan = await this.planPhase();
      
      if (!plan || plan.length === 0) {
        throw new Error("Failed to create research plan");
      }

      // 2. Iterative Research Phase
      const { allFindings, allCitations } = await this.researchPhase(plan, startTime);

      // 3. Synthesis Phase
      await this.synthesisPhase(allFindings, allCitations, startTime);

    } catch (err: any) {
      console.error("Research orchestration error:", err);
      this.updateState({ 
        status: "failed", 
        error: err.message || "An unknown error occurred during research"
      });
      throw err;
    }
  }

  private async planPhase(): Promise<string[]> {
    const plannerId = this.addStep("planning", "Breaking down query into research tasks...");
    
    try {
      const plan = await this.router.plan(this.query);
      this.completeStep(plannerId, "completed", `Created ${plan.length} research tasks.`, plan);
      return plan;
    } catch (err) {
      this.completeStep(plannerId, "failed", "Failed to create research plan.");
      throw err;
    }
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
      
      try {
        // Context Pruning: Only pass the most recent findings to the searcher
        const recentFindings = allFindings.slice(-5);
        const { sources, contents } = await this.router.searchAndFetch(
          this.query, 
          plan, 
          recentFindings, 
          this.config.filters
        );
        
        this.completeStep(searchId, "completed", `Found ${sources.length} relevant sources.`, sources);

        // Analysis
        this.updateState({ status: "fetching" });
        const analysisId = this.addStep("fetching", `Iteration ${iterations}: Analyzing content for top sources...`);

        let analyzedCount = 0;
        for (const { source, content } of contents) {
          if (allCitations.some(c => c.url === source.url)) {
            continue; // Skip duplicates
          }

          try {
            const findings = await this.router.analyze(content, this.query, source.title);
            
            if (findings && findings.trim().length > 0) {
              allFindings.push(findings);
              allCitations.push(source);
              analyzedCount++;
            }
          } catch (err) {
            console.error(`Failed to analyze ${source.url}:`, err);
          }
        }
        
        this.completeStep(analysisId, "completed", `Analyzed ${analyzedCount} sources successfully.`);

        // Check if we have enough information
        if (allFindings.length >= 3) {
          const isComplete = await this.router.checkCompleteness(this.query, allFindings);
          
          if (isComplete) {
            this.addStep("system", "Sufficient information gathered.");
            break;
          }
        }
      } catch (err) {
        console.error(`Error in research iteration ${iterations}:`, err);
        this.completeStep(searchId, "failed", `Iteration ${iterations} failed.`);
      }
    }

    return { allFindings, allCitations };
  }

  private async synthesisPhase(allFindings: string[], allCitations: Citation[], startTime: number): Promise<void> {
    this.updateState({ status: "synthesizing" });
    const synthId = this.addStep("synthesizing", "Synthesizing final report with citations...");
    
    try {
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
    } catch (err) {
      this.completeStep(synthId, "failed", "Failed to synthesize report.");
      throw err;
    }
  }
}
