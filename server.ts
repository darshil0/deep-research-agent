import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Run Research
  app.post("/api/research", (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const timestamp = Date.now();
    const slug = topic.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const folderName = `${timestamp}_${slug}`;
    const outputDir = path.join("research_outputs", folderName);
    
    if (!fs.existsSync("research_outputs")) {
      fs.mkdirSync("research_outputs");
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Copy the dummy files to the new folder for simulation
    const dummyReport = path.join(process.cwd(), "research_outputs", "report.md");
    const dummyArtifacts = path.join(process.cwd(), "research_outputs", "artifacts.json");
    
    if (fs.existsSync(dummyReport)) {
      fs.copyFileSync(dummyReport, path.join(outputDir, "report.md"));
    }
    if (fs.existsSync(dummyArtifacts)) {
      fs.copyFileSync(dummyArtifacts, path.join(outputDir, "artifacts.json"));
    }

    // Simulate a successful start
    res.json({ 
      status: "started", 
      message: `Researching: ${topic}`,
      id: folderName
    });
  });

  // API: Get History
  app.get("/api/history", (req, res) => {
    const historyDir = path.join(process.cwd(), "research_outputs");
    if (!fs.existsSync(historyDir)) {
      return res.json([]);
    }

    const folders = fs.readdirSync(historyDir)
      .filter(f => fs.lstatSync(path.join(historyDir, f)).isDirectory())
      .map(f => {
        const parts = f.split("_");
        const timestamp = parseInt(parts[0]);
        const topic = parts.slice(1).join(" ").replace(/-/g, " ");
        return { id: f, timestamp, topic };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json(folders);
  });

  // API: Get Results
  app.get("/api/results", (req, res) => {
    const id = req.query.id as string;
    const baseDir = id ? path.join("research_outputs", id) : path.join("research_outputs");
    
    // If no ID, try to find the most recent one
    let targetDir = baseDir;
    if (!id) {
      const historyDir = path.join(process.cwd(), "research_outputs");
      if (fs.existsSync(historyDir)) {
        const folders = fs.readdirSync(historyDir)
          .filter(f => fs.lstatSync(path.join(historyDir, f)).isDirectory())
          .sort((a, b) => parseInt(b.split("_")[0]) - parseInt(a.split("_")[0]));
        if (folders.length > 0) {
          targetDir = path.join(historyDir, folders[0]);
        }
      }
    }

    const reportPath = path.join(process.cwd(), targetDir, "report.md");
    const artifactsPath = path.join(process.cwd(), targetDir, "artifacts.json");

    if (fs.existsSync(reportPath)) {
      const report = fs.readFileSync(reportPath, "utf-8");
      const artifacts = fs.existsSync(artifactsPath) ? JSON.parse(fs.readFileSync(artifactsPath, "utf-8")) : null;
      res.json({ report, artifacts });
    } else {
      res.status(404).json({ error: "No report found yet." });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
