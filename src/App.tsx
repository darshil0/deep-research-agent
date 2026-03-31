import { useState, useEffect } from 'react';
import { Sun, Moon, Search, Zap, FileText, CheckCircle, AlertCircle, Terminal, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleStartResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsResearching(true);
    setProgress(0);
    
    // Simulate research progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsResearching(false);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
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
        
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-[var(--line)] transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-8">
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
              <span className="text-[10px] font-bold uppercase opacity-50">Idle</span>
            </div>
          </div>

          {/* Metrics Card */}
          <div className="border border-[var(--line)] p-4 space-y-4">
            <div className="col-header">Research Metrics</div>
            <div className="flex items-center justify-between">
              <span className="data-value text-xs">Sources Found</span>
              <span className="data-value text-lg">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="data-value text-xs">Evidence Points</span>
              <span className="data-value text-lg">0</span>
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

        {/* Recent Activity / Results Placeholder */}
        <section className="space-y-4">
          <div className="col-header">Recent Activity Log</div>
          <div className="border border-[var(--line)] divide-y divide-[var(--line)]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="data-row p-3 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-4">
                  <span className="opacity-30 font-mono">0{i}</span>
                  <span className="font-mono">SYSTEM_IDLE</span>
                </div>
                <span className="opacity-40 font-mono">--:--:--</span>
              </div>
            ))}
          </div>
        </section>
      </main>

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
