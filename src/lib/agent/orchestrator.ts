import { GoogleGenAI } from "@google/genai";
import { ResearchConfig, ResearchState, ResearchStep, ResearchReport, Citation } from "./types.ts";
import { Planner } from "./planner.ts";
import { Searcher } from "./searcher.ts";
import { Fetcher } from "./fetcher.ts";
import { Analyzer } from "./analyzer.ts";
import { Synthesizer } from "./synthesizer.ts";
import fs from "fs/promises";
import path from "path";

export class ResearchOrchestrator {
  private query: string;
  private config: ResearchConfig;
  private onUpdate: (state: ResearchState) => void;
  private state: ResearchState;
  private ai: GoogleGenAI;
  private taskId: string;

  constructor(query: string, config: ResearchConfig, onUpdate: (state: ResearchState) => void) {
    this.query = query;
    this.config = config;
    this.onUpdate = onUpdate;
    this.taskId = Math.random().toString(36).substring(7);
    this.state = {
      status: "idle",
      steps: [],
    };
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
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
      // 1. Planning
      const plannerId = this.addStep("planning", "Breaking down query into research tasks...");
      const planner = new Planner(this.ai);
      const plan = await planner.createPlan(this.query);
      this.completeStep(plannerId, "completed", "Research plan created.", plan);

      let allCitations: Citation[] = [];
      let allFindings: string[] = [];
      let iterations = 0;

      // 2. Iterative Research Loop
      while (iterations < this.config.maxIterations) {
        iterations++;
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > this.config.maxTimeSeconds) {
          this.addStep("system", "Time limit reached, synthesizing findings...");
          break;
        }

        this.updateState({ status: "searching" });
        const searchId = this.addStep("searching", `Iteration ${iterations}: Searching for information...`);
        const searcher = new Searcher(this.ai);
        
        // Context Pruning: Only pass the most recent findings to the searcher
        const recentFindings = allFindings.slice(-5);
        const searchResults = await searcher.search(this.query, plan, recentFindings);
        this.completeStep(searchId, "completed", `Found ${searchResults.length} relevant sources.`, searchResults);

        // 3. Fetching & Analysis
        this.updateState({ status: "fetching" });
        const fetchId = this.addStep("fetching", `Iteration ${iterations}: Fetching full content for top sources...`);
        const fetcher = new Fetcher();
        const analyzer = new Analyzer(this.ai);

        // Fetch top 3 most relevant sources for deep analysis
        const topSources = searchResults.slice(0, 3);
        for (const source of topSources) {
          if (allCitations.some(c => c.url === source.url)) continue; // Skip duplicates

          try {
            const content = await fetcher.fetch(source.url);
            if (content) {
              const findings = await analyzer.analyze(content, this.query, source.title);
              allFindings.push(findings);
              allCitations.push(source);
            }
          } catch (err) {
            console.error(`Failed to fetch ${source.url}:`, err);
          }
        }
        this.completeStep(fetchId, "completed", `Analyzed ${topSources.length} sources.`);

        // Check if we have enough information
        const isComplete = await analyzer.checkCompleteness(this.query, allFindings);
        if (isComplete) {
          this.addStep("system", "Sufficient information gathered.");
          break;
        }
      }

      // 4. Synthesis
      this.updateState({ status: "synthesizing" });
      const synthId = this.addStep("synthesizing", "Synthesizing final report with citations...");
      const synthesizer = new Synthesizer(this.ai);
      const report = await synthesizer.synthesize(this.query, allFindings, allCitations);
      
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

    } catch (err: any) {
      this.updateState({ status: "failed", error: err.message });
      throw err;
    }
  }
}
