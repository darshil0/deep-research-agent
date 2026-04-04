import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, CheckCircle2, XCircle, Clock, Hash, FileText, Settings, ExternalLink, ChevronRight, Info, History, Menu, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResearchState, ResearchConfig, ResearchStep, ResearchReport } from "./lib/agent/types.ts";
import ReactMarkdown from "react-markdown";
import { toast, Toaster } from "sonner";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
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
    },
    provider: "tavily",
  });
  const [targetLanguage, setTargetLanguage] = useState("Auto-detect");
  const [history, setHistory] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("authToken"));
  const [showAuthModal, setShowAuthModal] = useState(!localStorage.getItem("authToken"));
  const [tempToken, setTempToken] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore task from localStorage and load history
  useEffect(() => {
    const savedTaskId = localStorage.getItem("lastTaskId");
    if (savedTaskId) {
      setTaskId(savedTaskId);
      fetchStatus(savedTaskId);
    }
    loadHistory();
    setIsInitialLoading(false);
  }, []);

  const loadHistory = async () => {
    try {
      const headers: any = {};
      if (authToken) headers["Authorization"] = authToken;
      const response = await fetch("/api/research/history", { headers });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const fetchStatus = async (id: string) => {
    try {
      const headers: any = {};
      if (authToken) headers["Authorization"] = authToken;
      const response = await fetch(`/api/research/status/${id}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setState(data);
        if (data.status === "completed" || data.status === "failed") {
          setIsResearching(false);
        } else {
          setIsResearching(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch task status:", err);
    }
  };

  const selectHistoryItem = async (id: string) => {
    setTaskId(id);
    localStorage.setItem("lastTaskId", id);
    try {
      const response = await fetch(`/api/research/results/${id}`);
      if (response.ok) {
        const data = await response.json();
        setState(data);
        setIsResearching(data.status !== "completed" && data.status !== "failed");
        setQuery("");
      }
    } catch (err) {
      toast.error("Failed to load research result.");
    }
  };

  const startNewResearch = () => {
    setTaskId(null);
    setState(null);
    setQuery("");
    setIsResearching(false);
    localStorage.removeItem("lastTaskId");
  };

  const groupedHistory = history.reduce((acc: Record<string, any[]>, item) => {
    const date = new Date(item.timestamp);
    let group = "Earlier";
    
    if (isToday(date)) group = "Today";
    else if (isYesterday(date)) group = "Yesterday";
    else if (isThisWeek(date)) group = "This Week";
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  useEffect(() => {
    if (taskId) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = new URL(`${protocol}//${window.location.host}`);
      wsUrl.searchParams.set("taskId", taskId);
      if (authToken) wsUrl.searchParams.set("token", authToken);
      const ws = new WebSocket(wsUrl.toString());
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
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [state?.steps]);

  const clearCache = async () => {
    try {
      const response = await fetch("/api/research/cache/clear", { method: "POST" });
      if (response.ok) {
        toast.success("Cache cleared successfully.");
      } else {
        throw new Error("Failed to clear cache.");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsResearching(true);
    setTaskId(null);
    setState(null);

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = authToken;
      
      const response = await fetch("/api/research/start", {
        method: "POST",
        headers,
        body: JSON.stringify({ query, config: { ...config, language: targetLanguage } }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setShowAuthModal(true);
          throw new Error("Authentication required.");
        }
        throw new Error("Failed to start research.");
      }
      const data = await response.json();
      setTaskId(data.taskId);
      localStorage.setItem("lastTaskId", data.taskId);
      loadHistory(); // Refresh history list
    } catch (err: any) {
      toast.error(err.message);
      setIsResearching(false);
    }
  };

  const downloadReport = () => {
    if (!state?.report) return;
    const report = state.report;
    const markdown = `# ${report.query}\n\n## Summary\n${report.summary}\n\n${report.content}`;
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

  const printToPdf = () => {
    window.print();
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempToken.trim()) {
      setAuthToken(tempToken);
      localStorage.setItem("authToken", tempToken);
      setShowAuthModal(false);
      toast.success("Authenticated successfully.");
      loadHistory();
    }
  };

  const updateFilter = (key: keyof NonNullable<ResearchConfig["filters"]>, value: any) => {
    setConfig(prev => ({
      ...prev,
      filters: {
        dateRange: "all",
        excludeKeywords: [],
        ...prev.filters,
        [key]: value
      }
    }));
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      <Toaster position="top-center" theme="dark" />

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowAuthModal(false)} className="text-white/20 hover:text-white transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">Authentication Required</h2>
                  <p className="text-white/40 text-sm">Please enter your research session key to access the agent and its history.</p>
                </div>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <input 
                    type="password"
                    placeholder="Enter auth token..."
                    value={tempToken}
                    onChange={(e) => setTempToken(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header id="main-header" className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight truncate max-w-[150px] sm:max-w-none">Deep Research Agent</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={startNewResearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-xs font-semibold border border-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              NEW RESEARCH
            </button>
            <button 
              id="settings-toggle"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest hidden sm:block">v1.7.0</div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100-4rem)] overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-white/10 bg-black/20 backdrop-blur-md overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/40">
                  <History className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Research History</span>
                </div>
                <button 
                  onClick={loadHistory}
                  className="p-1.5 hover:bg-white/5 rounded-md text-white/20 hover:text-white transition-colors"
                >
                  <Loader2 className={cn("w-3.5 h-3.5", isInitialLoading && "animate-spin")} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-white/5">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-20">
                    <History className="w-8 h-8" />
                    <p className="text-xs">No previous research found</p>
                  </div>
                ) : (
                  Object.entries(groupedHistory).map(([group, items]: [string, any[]]) => (
                    <div key={group} className="space-y-2">
                      <div className="px-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">{group}</div>
                      {items.map((item) => (
                        <button
                          key={item.taskId}
                          onClick={() => selectHistoryItem(item.taskId)}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden",
                            taskId === item.taskId 
                              ? "bg-blue-600/10 border-blue-600/30 text-blue-400" 
                              : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10 hover:text-white"
                          )}
                        >
                          {taskId === item.taskId && (
                            <motion.div 
                              layoutId="active-history"
                              className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                            />
                          )}
                          <div className="flex flex-col gap-1">
                            <div className="text-xs font-medium line-clamp-2 leading-relaxed">
                              {item.query}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[9px] font-mono opacity-50 uppercase">{format(new Date(item.timestamp), "HH:mm")}</span>
                              {item.status === "completed" && <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10">
                <button 
                  onClick={startNewResearch}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Start New Task
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0a0a0a] to-[#0f0f12]">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Input & Progress */}
          <div className="md:col-span-5 space-y-8">
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">What would you like to research?</h2>
                <p className="text-white/50 text-base sm:text-lg">Enter a complex query and our agent will perform deep research for you.</p>
              </div>

              <form onSubmit={handleStartResearch} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., The impact of quantum computing..."
                  disabled={isResearching}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 pr-14 sm:pr-16 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:border-white/20 placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={isResearching || !query.trim()}
                  className="absolute right-2 top-2 bottom-2 px-3 sm:px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/20 text-white rounded-xl transition-all flex items-center justify-center shadow-lg shadow-blue-600/20"
                >
                  {isResearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
              </form>

              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Research Settings</h3>
                    <button onClick={() => setShowSettings(false)} className="text-xs text-white/40 hover:text-white">Close</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Search Provider</label>
                      <select 
                        value={config.provider}
                        onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="tavily">Tavily (Advanced)</option>
                        <option value="google">Google (Fast/Foundational)</option>
                        <option value="hybrid">Hybrid (Both)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Target Language</label>
                       <select 
                         value={targetLanguage}
                         onChange={(e) => setTargetLanguage(e.target.value)}
                         className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                       >
                         <option value="Auto-detect">Auto-detect</option>
                         <option value="English">English</option>
                         <option value="Spanish">Español</option>
                         <option value="French">Français</option>
                         <option value="German">Deutsch</option>
                         <option value="Chinese">中文</option>
                         <option value="Japanese">日本語</option>
                       </select>
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="full-page-fetch"
                      checked={config.useFullPageFetch}
                      onChange={(e) => setConfig({ ...config, useFullPageFetch: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-black/40 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="full-page-fetch" className="text-sm text-white/60">Use full-page fetches for deep analysis</label>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-blue-500 rounded-full" />
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Search Filters</h4>
                      </div>
                      <button 
                        onClick={clearCache}
                        className="text-[10px] font-mono text-white/20 hover:text-rose-400 transition-colors uppercase tracking-widest"
                      >
                        Clear Cache
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label htmlFor="date-range-select" className="text-xs text-white/40 uppercase tracking-wider font-semibold">Date Range</label>
                        <select 
                          id="date-range-select"
                          value={config.filters?.dateRange || "all"}
                          onChange={(e) => updateFilter("dateRange", e.target.value)}
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
                        <label htmlFor="domain-restriction-input" className="text-xs text-white/40 uppercase tracking-wider font-semibold">Domain Restriction</label>
                        <input 
                          id="domain-restriction-input"
                          type="text" 
                          placeholder="e.g., wikipedia.org"
                          value={config.filters?.domainRestriction || ""}
                          onChange={(e) => updateFilter("domainRestriction", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="exclude-keywords-input" className="text-xs text-white/40 uppercase tracking-wider font-semibold">Exclude Keywords</label>
                      <input 
                        id="exclude-keywords-input"
                        type="text" 
                        placeholder="e.g., forum, reddit, blog"
                        value={config.filters?.excludeKeywords?.join(", ") || ""}
                        onChange={(e) => updateFilter("excludeKeywords", e.target.value.split(",").map(k => k.trim()).filter(k => k !== ""))}
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
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-blue-500 rounded-full animate-pulse" />
                      <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Research Progress</h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      <Clock className="w-3 h-3" />
                      {state.status.toUpperCase()}
                    </div>
                  </div>

                  <div 
                    ref={scrollRef}
                    className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10"
                  >
                    {state.steps.map((step, i) => (
                      <motion.div 
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-3 sm:p-4 rounded-xl border transition-all",
                          step.status === "running" ? "bg-blue-500/5 border-blue-500/20" : "bg-white/5 border-white/10"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {step.status === "running" && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                            {step.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            {step.status === "failed" && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-white/30 tracking-wider">{step.type.toUpperCase()}</span>
                              <span className="text-[9px] text-white/20 font-mono">{format(new Date(step.timestamp), "HH:mm:ss")}</span>
                            </div>
                            <p className={cn("text-xs leading-relaxed", step.status === "running" ? "text-white font-medium" : "text-white/60")}>
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
          <div className="md:col-span-7 relative">
            <AnimatePresence mode="wait">
              {!state?.report ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02] p-6 sm:p-12 text-center space-y-6 relative overflow-hidden"
                >
                  {/* Atmospheric background elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-blue-600/5 rounded-full blur-[80px] sm:blur-[100px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-600/5 rounded-full blur-[80px] sm:blur-[100px]" />
                  </div>

                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center relative z-10">
                    <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white/20" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-lg sm:text-xl font-semibold">No Report Yet</h3>
                    <p className="text-white/40 max-w-sm mx-auto text-sm sm:text-base">Start a research task to generate a comprehensive report with citations.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="report"
                  id="research-report"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
                >
                  <div className="p-6 sm:p-8 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="w-fit px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] sm:text-xs font-semibold border border-emerald-500/20">
                        RESEARCH COMPLETE
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 no-print">
                        <button 
                          onClick={printToPdf}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] sm:text-xs transition-all shadow-lg shadow-blue-600/20"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          SAVE AS PDF
                        </button>
                        <button 
                          id="download-report-btn"
                          onClick={downloadReport}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] sm:text-xs transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          DOWNLOAD .MD
                        </button>
                        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-white/40 font-mono">
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
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight font-serif italic text-white/90">{state.report.query}</h2>
                    <div className="p-4 sm:p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <p className="text-white/80 leading-relaxed italic text-base sm:text-lg font-light">"{state.report.summary}"</p>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-10 sm:space-y-12">
                    <article className="prose prose-invert prose-blue max-w-none prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-white/80 prose-p:text-base sm:text-lg prose-p:font-light">
                      <ReactMarkdown>{state.report.content}</ReactMarkdown>
                    </article>

                    <section className="space-y-6 pt-10 sm:pt-12 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight">Sources & Citations</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/10 mt-12 bg-black/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white/20 text-[10px] sm:text-xs font-mono text-center md:text-left">
              <div>© 2026 DEEP RESEARCH AGENT. ALL RIGHTS RESERVED.</div>
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
                <a href="#" className="hover:text-white transition-colors">DOCUMENTATION</a>
                <a href="#" className="hover:text-white transition-colors">API REFERENCE</a>
                <a href="#" className="hover:text-white transition-colors">PRIVACY POLICY</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
