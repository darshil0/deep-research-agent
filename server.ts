import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import fs from "fs/promises";
import { ResearchOrchestrator } from "./src/lib/agent/orchestrator.ts";
import { ResearchConfig, ResearchState } from "./src/lib/agent/types.ts";

async function rotateResults() {
  try {
    const dir = path.join(process.cwd(), "research_results");
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const now = Date.now();
    const maxAgeDays = process.env.RESULTS_MAX_AGE_DAYS
      ? parseInt(process.env.RESULTS_MAX_AGE_DAYS)
      : 7;
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.endsWith(".json") && file !== "cache") {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`Rotated old result: ${file}`);
        }
      }
    }
  } catch (err) {
    console.error("Failed to rotate results:", err);
  }
}

// Error handling middleware
const errorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) => {
  console.error("Express Error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
};

async function startServer() {
  await rotateResults();
  const app = express();
  const PORT = 3000;

  // Authentication Middleware
  const authStartTime = Date.now();
  const authMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const token = req.headers["authorization"] || req.query.token;

    if (process.env.AUTH_TOKEN && token !== process.env.AUTH_TOKEN) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing AUTH_TOKEN" });
    }

    // Token Expiry Logic
    if (process.env.TOKEN_EXPIRY_SECONDS) {
      const expiryMs = parseInt(process.env.TOKEN_EXPIRY_SECONDS) * 1000;
      if (Date.now() - authStartTime > expiryMs) {
        return res.status(401).json({ error: "Unauthorized: Token has expired" });
      }
    }

    next();
  };

  app.use(express.json());

  // Public status route
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Protected routes
  app.use("/api/research", authMiddleware);

  // In-memory storage for research tasks
  const tasks = new Map<string, ResearchState>();
  const clients = new Map<string, WebSocket>();

  // API routes
  app.post("/api/research/start", async (req, res, next) => {
    try {
      const { query, config } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "Query is required" });
      }

      const taskId = Math.random().toString(36).substring(7);
      const state: ResearchState = {
        status: "idle",
        steps: [],
      };
      tasks.set(taskId, state);

      // Start research in background
      const orchestrator = new ResearchOrchestrator(
        query.trim(),
        config as ResearchConfig,
        (update) => {
          tasks.set(taskId, update);
          const ws = clients.get(taskId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(update));
          }
        },
      );

      orchestrator.run().catch((err) => {
        console.error(`Task ${taskId} failed:`, err);
        const currentState = tasks.get(taskId) || { status: "idle", steps: [] };
        const failedState: ResearchState = {
          ...currentState,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        };
        tasks.set(taskId, failedState);
        const ws = clients.get(taskId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(failedState));
        }
      });

      res.json({ taskId });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/research/status/:taskId", (req, res) => {
    const { taskId } = req.params;
    const state = tasks.get(taskId);
    if (!state) return res.status(404).json({ error: "Task not found" });
    res.json(state);
  });

  app.get("/api/research/history", async (req, res, next) => {
    try {
      const dir = path.join(process.cwd(), "research_results");
      await fs.mkdir(dir, { recursive: true });
      const files = await fs.readdir(dir);
      const history = [];

      for (const file of files) {
        if (file.endsWith(".json") && file !== "cache") {
          const content = await fs.readFile(path.join(dir, file), "utf-8");
          const state: ResearchState = JSON.parse(content);
          if (state.report) {
            history.push({
              taskId: file.replace(".json", ""),
              query: state.report.query,
              timestamp: state.report.metadata.timestamp || new Date().toISOString(), // Fallback
              status: state.status,
            });
          }
        }
      }

      // Sort by timestamp descending
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(history);
    } catch (err: any) {
      next(err);
    }
  });

  app.get("/api/research/results/:taskId", async (req, res, next) => {
    const { taskId } = req.params;
    try {
      const filePath = path.join(process.cwd(), "research_results", `${taskId}.json`);
      const content = await fs.readFile(filePath, "utf-8");
      res.json(JSON.parse(content));
    } catch (err: any) {
      if (err && err.code === "ENOENT") {
        return res.status(404).json({ error: "Research result not found" });
      }
      next(err);
    }
  });

  app.post("/api/research/cache/clear", async (req, res, next) => {
    try {
      const { ContentCache } = await import("./src/lib/utils/cache.ts");
      const cache = new ContentCache();
      await cache.clear();
      res.json({ message: "Cache cleared" });
    } catch (err: any) {
      next(err);
    }
  });

  // Use centralized error handling
  app.use(errorHandler);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket setup
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws: WebSocket, req: any) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const taskId = url.searchParams.get("taskId");
    const token = url.searchParams.get("token");

    // Secure WebSocket connection
    if (process.env.AUTH_TOKEN && token !== process.env.AUTH_TOKEN) {
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      ws.close(1008, "Unauthorized");
      return;
    }

    // Token Expiry Logic for WebSocket
    if (process.env.TOKEN_EXPIRY_SECONDS) {
      const expiryMs = parseInt(process.env.TOKEN_EXPIRY_SECONDS) * 1000;
      if (Date.now() - authStartTime > expiryMs) {
        ws.send(JSON.stringify({ type: "error", message: "Token has expired" }));
        ws.close(1008, "Token has expired");
        return;
      }
    }

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
