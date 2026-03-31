import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, CheckCircle2, XCircle, Clock, Hash, FileText, Settings, ExternalLink, ChevronRight, ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResearchState, ResearchConfig, ResearchStep, ResearchReport } from "./lib/agent/types.ts";
import ReactMarkdown from "react-markdown";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [state, setState] = useState<ResearchState | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<ResearchConfig>({
    maxIterations: 3,
    maxTimeSeconds: 300,
    budgetTokens: 100000,
    useFullPageFetch: true,
    filters: {
      dateRange: "all",
      excludeKeywords: [],
    }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (taskId) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}?taskId=${taskId}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const update: ResearchState = JSON.parse(event.data);
        setState(update);
        if (update.status === "completed" || update.status === "failed") {
          setIsResearching(false);
          ws.close();
        }
      };

      ws.onerror = () => {
        toast.error("WebSocket connection failed.");
        setIsResearching(false);
      };

      return () => {
        ws.close();
      };
    }
  }, [taskId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state?.steps]);

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsResearching(true);
    setTaskId(null);
    setState(null);

    try {
      const response = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, config }),
      });

      if (!response.ok) throw new Error("Failed to start research.");
      const data = await response.json();
      setTaskId(data.taskId);
    } catch (err: any) {
      toast.error(err.message);
      setIsResearching(false);
    }
  };

  const downloadReport = () => {
    if (!state?.report) return;
    const report = state.report;
    const markdown = `# ${report.query}\n\n## Summary\n${report.summary}\n\n## Findings\n${report.content}\n\n## Sources\n${report.citations.map((c, i) => `[${i + 1}] ${c.title} - ${c.url}`).join("\n")}`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.query.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully.");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Deep Research Agent</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="text-xs font-mono text-white/40 uppercase tracking-widest">v1.0.0</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Input & Progress */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">What would you like to research?</h2>
                <p className="text-white/50 text-lg">Enter a complex query and our agent will perform deep research for you.</p>
              </div>

              <form onSubmit={handleStartResearch} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., The impact of quantum computing on modern cryptography..."
                  disabled={isResearching}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-white/20"
                />
                <button
                  type="submit"
                  disabled={isResearching || !query.trim()}
                  className="absolute right-3 top-3 bottom-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/20 text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-blue-600/20"
                >
                  {isResearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-6 h-6" />}
                </button>
              </form>

              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Research Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-xs text-white/40 hover:text-white">Close</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Max Iterations</label>
                      <input 
                        type="number" 
                        value={config.maxIterations}
                        onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Time Limit (s)</label>
                      <input 
                        type="number" 
                        value={config.maxTimeSeconds}
                        onChange={(e) => setConfig({ ...config, maxTimeSeconds: parseInt(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={config.useFullPageFetch}
                      onChange={(e) => setConfig({ ...config, useFullPageFetch: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-black/40 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-white/60">Use full-page fetches for deep analysis</label>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Search Filters</h4>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Date Range</label>
                        <select 
                          value={config.filters?.dateRange || "all"}
                          onChange={(e) => setConfig({ 
                            ...config, 
                            filters: { 
                              excludeKeywords: [],
                              ...config.filters,
                              dateRange: e.target.value as any 
                            } 
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                        >
                          <option value="all">All Time</option>
                          <option value="day">Past 24 Hours</option>
                          <option value="week">Past Week</option>
                          <option value="month">Past Month</option>
                          <option value="year">Past Year</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Domain Restriction</label>
                        <input 
                          type="text" 
                          placeholder="e.g., wikipedia.org"
                          value={config.filters?.domainRestriction || ""}
                          onChange={(e) => setConfig({ 
                            ...config, 
                            filters: { 
                              dateRange: "all",
                              excludeKeywords: [],
                              ...config.filters,
                              domainRestriction: e.target.value 
                            } 
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Exclude Keywords</label>
                      <input 
                        type="text" 
                        placeholder="e.g., forum, reddit, blog"
                        value={config.filters?.excludeKeywords?.join(", ") || ""}
                        onChange={(e) => setConfig({ 
                          ...config, 
                          filters: { 
                            dateRange: "all",
                            ...config.filters,
                            excludeKeywords: e.target.value.split(",").map(k => k.trim()).filter(k => k !== "") 
                          } 
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm placeholder:text-white/20"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </section>

            {/* Progress Steps */}
            <AnimatePresence>
              {state && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Research Progress</h3>
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                      <Clock className="w-3 h-3" />
                      {state.status.toUpperCase()}
                    </div>
                  </div>

                  <div 
                    ref={scrollRef}
                    className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10"
                  >
                    {state.steps.map((step, i) => (
                      <motion.div 
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-4 rounded-xl border transition-all",
                          step.status === "running" ? "bg-blue-500/5 border-blue-500/20" : "bg-white/5 border-white/10"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {step.status === "running" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                            {step.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {step.status === "failed" && <XCircle className="w-4 h-4 text-rose-500" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono text-white/40">{step.type.toUpperCase()}</span>
                              <span className="text-[10px] text-white/20">{format(new Date(step.timestamp), "HH:mm:ss")}</span>
                            </div>
                            <p className={cn("text-sm", step.status === "running" ? "text-white" : "text-white/70")}>
                              {step.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Results & Report */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!state?.report ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[600px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02] p-12 text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-white/20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">No Report Yet</h3>
                    <p className="text-white/40 max-w-sm mx-auto">Start a research task to generate a comprehensive report with citations.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="report"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                >
                  <div className="p-8 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/20">
                        RESEARCH COMPLETE
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={downloadReport}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          DOWNLOAD .MD
                        </button>
                        <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {state.report.metadata.totalTime.toFixed(1)}s
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" />
                            {state.report.metadata.totalSteps} STEPS
                          </div>
                        </div>
                      </div>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">{state.report.query}</h2>
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <p className="text-white/80 leading-relaxed italic">"{state.report.summary}"</p>
                    </div>
                  </div>

                  <div className="p-8 space-y-12">
                    <article className="prose prose-invert prose-blue max-w-none prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-white/80">
                      <ReactMarkdown>{state.report.content}</ReactMarkdown>
                    </article>

                    <section className="space-y-6 pt-12 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-400" />
                        <h3 className="text-xl font-bold tracking-tight">Sources & Citations</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {state.report.citations.map((citation, i) => (
                          <a 
                            key={citation.id}
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-600/30">[{i + 1}]</span>
                                  <h4 className="text-sm font-semibold line-clamp-1 group-hover:text-blue-400 transition-colors">{citation.title}</h4>
                                </div>
                                <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{citation.snippet}</p>
                                <div className="text-[10px] text-white/20 font-mono truncate pt-1">{citation.url}</div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white transition-colors flex-shrink-0" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/10 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white/20 text-xs font-mono">
          <div>© 2026 DEEP RESEARCH AGENT. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-white transition-colors">DOCUMENTATION</a>
            <a href="#" className="hover:text-white transition-colors">API REFERENCE</a>
            <a href="#" className="hover:text-white transition-colors">PRIVACY POLICY</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
