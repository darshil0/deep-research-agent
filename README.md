# Deep Research Agent

An autonomous, iterative research agent built with TypeScript/React, powered by Google's Gemini 2.0 Flash model. This production-ready platform performs deep web research, extracts evidence, and synthesizes comprehensive reports with citations.

For a detailed history of changes and version updates, please see the [Changelog](file:///c:/Users/mayan/Downloads/deep-research-agent/Changelog.MD).

## 🚀 Features

- **Multi-Provider Search**: Choose between Tavily, Google Search Tool (Grounding), or a Hybrid mode for maximum research coverage.
- **Secure API Authentication**: Protected by an `AUTH_TOKEN` system with Express middleware and secure WebSocket handshakes.
- **Native Multi-language Support**: Automatically detects research language and generates reports in any user-specified language (English, Spanish, Chinese, French, German, Japanese, and more).
- **Professional PDF Export**: One-click "Save as PDF" with optimized layout and typography for professional physical or digital distribution.
- **Iterative Research**: Decomposes complex queries into sub-tasks and iteratively improves its understanding based on search findings.
- **Research History Sidebar**: Chronologically grouped sidebar ("Today", "Yesterday", "Earlier") to revisit, search, and manage past reports.
- **Session Persistence**: Automatic recovery of current research states from `localStorage` if the browser is refreshed.
- **Intelligent Caching**: High-performance file-based content cache with configurable TTL and automatic rotation of old results.
- **Real-time Progress**: Live updates via WebSocket with automatic reconnection and detailed activity logs.
- **Unit Tested**: Core agent logic is verified by a robust suite of Vitest unit tests.

## 🏗️ Architecture

### AI & Agent Layer (TypeScript)
- **ResearchOrchestrator**: Manages the high-level research lifecycle (Plan -> Research -> Synthesize).
- **Router**: Dispatches tasks to specific agent modules and handles state synchronization.
- **Planner**: Decomposes the research topic into logical, actionable sub-queries using Gemini 1.5/2.0.
- **Searcher**: A provider-agnostic search interface that can swap between Tavily, Google, or Hybrid backends.
- **Analyzer**: Processes raw source content to extract relevant evidence and claims.
- **Synthesizer**: Compiles findings into a structured Markdown report with mandatory inline citations.

### Backend (Node.js/Express)
- **Server**: Handles API endpoints, authentication middleware, and WebSocket connections.
- **ContentCache**: A robust caching layer that stores fetched HTML content to reduce API costs and latency.
- **Rotation Policy**: Automatically cleans up research results older than 7 days to manage storage.

### Frontend (React + Vite)
- **Modern UI**: A premium, dark-themed interface built for speed and visual excellence.
- **Auth Modal**: Integrated task-level security for private or team research sessions.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop workflows.

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- **Google AI Studio API Key** (Required for Gemini)
- **Tavily API Key** (Optional, but recommended for advanced search)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd deep-research-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment in `.env`:
   ```bash
   # Required
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional Features
   TAVILY_API_KEY=your_tavily_api_key_here
   AUTH_TOKEN=your_secure_session_key         # Enable API protection
   AGENT_MODEL=gemini-2.0-flash-exp           # Default model
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the application at `http://localhost:3000`.

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | **Yes** | - | Google Gemini API key |
| `TAVILY_API_KEY` | No | - | Tavily Search API key |
| `AUTH_TOKEN` | No | - | Token required for API and WebSocket access |
| `AGENT_MODEL` | No | `gemini-2.0-flash-exp` | AI model used for planning/synthesis |
| `RESULTS_MAX_AGE_DAYS` | No | `7` | Days to keep result files |
| `CACHE_TTL` | No | `86400` | Content cache duration (seconds) |

### Search Provider Modes
- **Tavily**: Uses the Tavily API for highly relevant research results and content extraction.
- **Google**: Uses the foundational Google Search tool for grounding (no extra API key needed beyond Gemini).
- **Hybrid**: Uses both for maximum breadth and verification.

## 📝 API Reference

### Protected Endpoints (Requires `Authorization` header if `AUTH_TOKEN` is set)
- `GET /api/research/history`: List all research tasks.
- `POST /api/research/start`: Initialize a new research task.
- `GET /api/research/results/:taskId`: Retrieve final report and steps.
- `GET /api/research/status/:taskId`: Real-time status check.

### WebSocket
- `ws://localhost:3000?taskId={taskId}&token={AUTH_TOKEN}`: Real-time research stream.

## 🧪 Development

### Running Tests
```bash
npm test          # Run Vitest suite
npm run lint      # Lint codebase
```

### Build for Production
```bash
npm run build     # Output to /dist
npm run preview   # Preview production build
```

## 📜 License
MIT License - see [LICENSE](LICENSE) for details.

---
**Version**: 1.7.0  
**Status**: Feature Complete ✅  
**Last Updated**: April 4, 2026
