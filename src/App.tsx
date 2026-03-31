import { useState, useEffect, FormEvent } from 'react';
import { Sun, Moon, Search, Zap, FileText, CheckCircle, AlertCircle, Terminal, Info, History, Clock, ChevronRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [topic, setTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [logs, setLogs] = useState<{ id: string; stage: string; timestamp: string; status: 'pending' | 'completed' | 'active' }[]>([]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const addLog = (stage: string, status: 'pending' | 'completed' | 'active' = 'active') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => {
      const existing = prev.find(l => l.stage === stage);
      if (existing) {
        return prev.map(l => l.stage === stage ? { ...l, status, timestamp: time } : l);
      }
      return [...prev, { id: Math.random().toString(36).substr(2, 9), stage, timestamp: time, status }];
    });
  };

  useEffect(() => {
    fetchHistory();
    addLog("SYSTEM_READY: WAITING_FOR_INPUT");
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const toggleTheme = () => setIsDark(!isDark);

  const loadReport = async (id: string) => {
    setIsResearching(true);
    setProgress(0);
    setError(null);
    setReport(null);
    setArtifacts(null);
    setLogs([]);
    addLog(`LOADING_ARCHIVE: ${id}`);
    
    try {
      const response = await fetch(`/api/results?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setArtifacts(data.artifacts);
        setProgress(100);
        addLog("ARCHIVE_LOAD_COMPLETE");
        if (data.artifacts?.logs) {
          setLogs(data.artifacts.logs);
        }
      } else {
        throw new Error("Report not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      addLog("ERROR: FAILED_TO_LOAD_ARCHIVE");
    } finally {
      setIsResearching(false);
    }
  };

  const handleStartResearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsResearching(true);
    setProgress(0);
    setError(null);
    setReport(null);
    setArtifacts(null);
    setLogs([]);
    
    setLogs([
      { id: '1', stage: 'Planning', timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }), status: 'active' },
      { id: '2', stage: 'Searching', timestamp: '--:--', status: 'pending' },
      { id: '3', stage: 'Fetching', timestamp: '--:--', status: 'pending' },
      { id: '4', stage: 'Synthesizing', timestamp: '--:--', status: 'pending' },
    ]);
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) throw new Error('Failed to start research');
      const { id } = await response.json();

      // Simulate progress through requested stages
      const stages: ('Planning' | 'Searching' | 'Fetching' | 'Synthesizing')[] = ['Planning', 'Searching', 'Fetching', 'Synthesizing'];
      let currentIdx = 0;

      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 1;
          if (next >= 95) {
            clearInterval(interval);
            return 95;
          }
          
          const stageIdx = Math.floor(next / 25);
          if (stageIdx > currentIdx && stageIdx < stages.length) {
            setLogs(prevLogs => prevLogs.map((l, i) => {
              if (i === currentIdx) return { ...l, status: 'completed' };
              if (i === stageIdx) return { ...l, status: 'active', timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) };
              return l;
            }));
            currentIdx = stageIdx;
          }
          
          return next;
        });
      }, 50);

      // Poll for results after some time
      setTimeout(async () => {
        try {
          const resResponse = await fetch(`/api/results?id=${id}`);
          if (resResponse.ok) {
            const data = await resResponse.json();
            setReport(data.report);
            setArtifacts(data.artifacts);
            setProgress(100);
            setLogs(prevLogs => prevLogs.map(l => ({ ...l, status: 'completed' })));
            setIsResearching(false);
            fetchHistory(); // Refresh history
          } else {
            setProgress(100);
            setIsResearching(false);
            setLogs(prevLogs => prevLogs.map(l => ({ ...l, status: 'completed' })));
          }
        } catch (e) {
          setIsResearching(false);
          setLogs(prevLogs => prevLogs.map(l => ({ ...l, status: 'completed' })));
        }
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsResearching(false);
      addLog("ERROR: INITIALIZATION_FAILED");
    }
  };

  const handleDownload = () => {
    if (!report) return;
    
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[var(--line)] flex items-center justify-between px-6 sticky top-0 bg-[var(--bg)] z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--accent)] rounded flex items-center justify-center">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="font-mono font-bold tracking-tighter text-xl">DEEP_RESEARCH_v1.0</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-full transition-colors ${showHistory ? 'bg-[var(--ink)] text-[var(--bg)]' : 'hover:bg-[var(--line)]'}`}
            aria-label="Toggle history"
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--line)] transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-72 border-r border-[var(--line)] bg-[var(--bg)] overflow-y-auto flex flex-col"
            >
              <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
                <span className="col-header">Research History</span>
                <span className="text-[10px] font-mono opacity-50">{history.length} ITEMS</span>
              </div>
              <div className="flex-1 divide-y divide-[var(--line)]">
                {history.length === 0 ? (
                  <div className="p-8 text-center opacity-30 font-mono text-[10px]">NO_RECORDS_FOUND</div>
                ) : (
                  history.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => loadReport(item.id)}
                      className="w-full p-4 text-left hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono opacity-50 group-hover:opacity-100">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs font-mono font-bold truncate uppercase tracking-tight">
                        {item.topic}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Input Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Terminal className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Initialization</span>
            </div>
            
            <form onSubmit={handleStartResearch} className="relative">
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter research topic or question..."
                className="w-full bg-[var(--bg)] border-2 border-[var(--ink)] p-4 pr-16 font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                disabled={isResearching}
              />
              <button 
                type="submit"
                disabled={isResearching || !topic.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-[var(--ink)] text-[var(--bg)] hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isResearching ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Search className="w-4 h-4" /></motion.div> : <Search className="w-4 h-4" />}
                <span className="hidden sm:inline font-mono text-xs font-bold uppercase">Execute</span>
              </button>
            </form>
          </section>

          {/* Progress Section */}
          <AnimatePresence>
            {isResearching && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-2"
              >
                <div className="flex justify-between font-mono text-[10px] uppercase opacity-60">
                  <span>Analyzing subquestions...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 bg-[var(--line)] w-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status Card */}
            <div className="border border-[var(--line)] p-4 space-y-4">
              <div className="col-header">System Status</div>
              <div className="flex items-center justify-between">
                <span className="data-value text-xs">Engine</span>
                <span className="text-[10px] font-bold uppercase text-green-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="data-value text-xs">Search API</span>
                <span className="text-[10px] font-bold uppercase text-green-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="data-value text-xs">Extraction</span>
                <span className={`text-[10px] font-bold uppercase ${isResearching ? 'text-[var(--accent)] animate-pulse' : 'opacity-50'}`}>
                  {isResearching ? 'Active' : 'Idle'}
                </span>
              </div>
            </div>

            {/* Metrics Card */}
            <div className="border border-[var(--line)] p-4 space-y-4">
              <div className="col-header">Research Metrics</div>
              <div className="flex items-center justify-between">
                <span className="data-value text-xs">Sources Found</span>
                <span className="data-value text-lg">{artifacts?.sources?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="data-value text-xs">Evidence Points</span>
                <span className="data-value text-lg">{artifacts?.evidence?.length || 0}</span>
              </div>
            </div>

            {/* Activity Log */}
            <div className="border border-[var(--line)] bg-[var(--bg)]">
              <div className="col-header p-3 border-b border-[var(--line)] flex items-center justify-between">
                <span>Activity Log</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-[var(--accent)] rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-[var(--accent)] rounded-full animate-pulse delay-75" />
                  <div className="w-1 h-1 bg-[var(--accent)] rounded-full animate-pulse delay-150" />
                </div>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {logs.length === 0 ? (
                  <div className="p-4 text-[10px] font-mono opacity-40 text-center italic">
                    Waiting for input...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 flex items-center justify-between group hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors">
                      <div className="flex items-center gap-3">
                        {log.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : log.status === 'active' ? (
                          <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Clock className="w-3 h-3 opacity-30" />
                        )}
                        <span className={`text-[10px] font-mono ${log.status === 'active' ? 'text-[var(--accent)] font-bold' : ''}`}>
                          {log.stage.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100">{log.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="border border-[var(--line)] p-4 space-y-4 bg-[var(--ink)] text-[var(--bg)]">
              <div className="col-header opacity-50 text-[var(--bg)]">Instructions</div>
              <p className="text-[10px] leading-relaxed opacity-80">
                Enter a complex topic to begin an iterative deep research process. 
                The agent will decompose the request, search the web, and synthesize 
                a comprehensive report with citations.
              </p>
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <Info className="w-3 h-3" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">v1.0.4 - Stable</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {report && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-[var(--line)] p-8 bg-[var(--bg)] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div className="col-header">Final Research Report</div>
                <div className="flex gap-4 items-center">
                  <div className="text-[10px] font-mono">CONFIDENCE: <span className="text-[var(--accent)]">{artifacts?.report?.confidence_score * 100}%</span></div>
                  <div className="text-[10px] font-mono">SOURCES: {artifacts?.sources?.length}</div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[var(--ink)] text-[var(--bg)] text-[10px] font-mono hover:opacity-80 transition-opacity"
                    title="Download Markdown"
                  >
                    <Download className="w-3 h-3" />
                    <span>DOWNLOAD .MD</span>
                  </button>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none font-sans leading-relaxed">
                <Markdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a 
                        {...props} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title={props.href}
                        className="text-[var(--accent)] hover:underline cursor-pointer"
                      />
                    )
                  }}
                >
                  {report}
                </Markdown>
              </div>
            </motion.section>
          )}

          {/* Recent Activity / Results Placeholder */}
          <section className="space-y-4">
            <div className="col-header">Recent Activity Log</div>
            <div className="border border-[var(--line)] divide-y divide-[var(--line)]">
              {logs.length === 0 ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="data-row p-3 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-4">
                      <span className="opacity-30 font-mono">0{i}</span>
                      <span className="font-mono">SYSTEM_IDLE</span>
                    </div>
                    <span className="opacity-40 font-mono">--:--:--</span>
                  </div>
                ))
              ) : (
                logs.map((log, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={log.id} 
                    className="data-row p-3 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-4">
                      <span className="opacity-30 font-mono">{(logs.length - index).toString().padStart(2, '0')}</span>
                      <span className={`font-mono ${log.status === 'active' ? 'text-[var(--accent)] font-bold' : ''}`}>
                        {log.stage.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[9px] font-mono ${log.status === 'completed' ? 'text-green-500' : log.status === 'active' ? 'text-[var(--accent)]' : 'opacity-40'}`}>
                        {log.status.toUpperCase()}
                      </span>
                      <span className="opacity-40 font-mono">{log.timestamp}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="h-12 border-t border-[var(--line)] flex items-center justify-between px-6 text-[9px] font-mono opacity-50">
        <span>© 2026 DEEP_RESEARCH_LABS</span>
        <div className="flex gap-4">
          <span>LATENCY: 42MS</span>
          <span>UPTIME: 99.9%</span>
        </div>
      </footer>
    </div>
  );
}
