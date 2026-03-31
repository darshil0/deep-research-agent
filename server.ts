import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { ResearchOrchestrator } from "./src/lib/agent/orchestrator.ts";
import { ResearchConfig, ResearchState } from "./src/lib/agent/types.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Validate API Key
  if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL: GEMINI_API_KEY is not set in environment variables.");
  }

  app.use(express.json());

  // In-memory storage for research tasks
  const tasks = new Map<string, ResearchState>();
  const clients = new Map<string, WebSocket>();

  // API routes
  app.post("/api/research/start", async (req, res) => {
    const { query, config } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const taskId = Math.random().toString(36).substring(7);
    const state: ResearchState = {
      status: "idle",
      steps: [],
    };
    tasks.set(taskId, state);

    // Start research in background
    const orchestrator = new ResearchOrchestrator(query, config as ResearchConfig, (update) => {
      tasks.set(taskId, update);
      const ws = clients.get(taskId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(update));
      }
    });

    orchestrator.run().catch((err) => {
      console.error(`Task ${taskId} failed:`, err);
      const failedState: ResearchState = {
        ...tasks.get(taskId)!,
        status: "failed",
        error: err.message,
      };
      tasks.set(taskId, failedState);
      const ws = clients.get(taskId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(failedState));
      }
    });

    res.json({ taskId });
  });

  app.get("/api/research/status/:taskId", (req, res) => {
    const { taskId } = req.params;
    const state = tasks.get(taskId);
    if (!state) return res.status(404).json({ error: "Task not found" });
    res.json(state);
  });

  app.post("/api/research/cache/clear", async (req, res) => {
    try {
      const { ContentCache } = await import("./src/lib/utils/cache.ts");
      const cache = new ContentCache();
      await cache.clear();
      res.json({ message: "Cache cleared" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket setup
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws, req) => {
    const taskId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get("taskId");
    if (taskId) {
      clients.set(taskId, ws);
      const state = tasks.get(taskId);
      if (state) ws.send(JSON.stringify(state));

      ws.on("close", () => {
        clients.delete(taskId);
      });
    }
  });
}

startServer();
