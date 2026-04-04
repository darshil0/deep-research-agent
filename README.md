# Deep Research Agent

An autonomous, iterative research agent built with TypeScript/React (legacy Python version included), powered by Google's Gemini 2.0 Flash model.

## Version 1.6.0 - Advanced History & Architecture Refactor

This release introduces significant performance, usability, and stability improvements:

- 🗄️ **Advanced History Sidebar**: A premium, collapsible sidebar with chronological grouping ("Today", "Yesterday", "Earlier") for managing past research tasks.
- 🔄 **State Persistence**: Full `localStorage` integration ensures research sessions are preserved across browser refreshes and accidental closures.
- 🏗️ **Simplified Architecture**: Refactored agent orchestration by removing redundant intermediate wrappers, resulting in faster execution and cleaner code.
- 🧪 **Unit Testing Suite**: Established a robust testing framework using Vitest, covering core AI logic and utility modules.
- ⚙️ **Enhanced Configuration**: Support for environment-based model selection (`AGENT_MODEL`), research results rotation (`RESULTS_MAX_AGE_DAYS`), and configurable cache TTL.
- 🚀 **Performance Optimization**: Improved frontend responsiveness and smoother transitions using `framer-motion`.

## Features

- **Iterative Research**: Expands search queries based on findings
- **Full-Page Analysis**: Fetches and extracts evidence from web sources
- **Research History**: Chronologically grouped sidebar to revisit and manage past reports
- **Session Persistence**: Automatically resumes or restores current research state
- **Citation Management**: Automatically tracks and cites sources with inline citations
- **Advanced Search Filters**: Date range, domain restriction, and keyword exclusion
- **Intelligent Caching**: File-based content cache with configurable TTL
- **Real-time Progress**: WebSocket-based live updates with auto-reconnection
- **Unit Tested**: Core logic is verified by a comprehensive testing suite

## Architecture

### Backend (TypeScript/Node.js)

- **ResearchOrchestrator**: Manages the workflow with distinct phases (plan, research, synthesis)
- **Router**: Directly dispatches tasks to core logic modules
- **Planner**: Decomposes topics into subquestions using Gemini AI
- **Searcher**: Interfaces with Tavily API and handles source fetching logic
- **Analyzer**: Extracts evidence from source content
- **Synthesizer**: Generates comprehensive reports with citations
- **Fetcher**: Extracts text from URLs with content caching
- **ContentCache**: File-based caching with configurable TTL and automatic rotation

### Frontend (React + TypeScript)

- Modern dark-themed UI with premium aesthetics
- **History Sidebar**: Collapsible, chronologically grouped task list
- **State Restoration**: Automatic session recovery from `localStorage`
- Real-time research progress tracking and activity logs
- Interactive settings panel with advanced filters and model info
- Downloadable Markdown reports

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Gemini API key (required)
- Tavily API key (optional, but recommended for better search)

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

3. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here  # Optional
   ```

   **Important**: The `GEMINI_API_KEY` is **required**. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:3000`

## Usage

### Starting a Research Task

1. Enter your research query in the input field (e.g., "The impact of quantum computing on cryptography")
2. Optionally configure research settings:
   - Max iterations (1-10)
   - Time limit (60-600 seconds)
   - Full-page fetch toggle
   - Search filters (date range, domain restriction, keyword exclusion)
3. Click the arrow button or press Enter to start
4. Monitor real-time progress in the activity log
5. Download the generated report as Markdown when complete

### Advanced Settings

**Search Filters:**
- **Date Range**: Filter results by recency (past day, week, month, year, or all time)
- **Domain Restriction**: Limit searches to specific domains (e.g., `wikipedia.org`)
- **Exclude Keywords**: Remove results containing specific terms (comma-separated)

**Research Configuration:**
- **Max Iterations**: Number of search-analyze cycles (default: 3)
- **Time Limit**: Maximum research duration in seconds (default: 300)
- **Full-page Fetch**: Enable deep content extraction from sources

### Cache Management

The system automatically caches fetched content for 24 hours to improve performance. Clear the cache manually from the settings panel if needed.

## API Reference

### GET `/api/research/history`

Fetch a summary of all past research tasks.

**Response:**
```json
[
  {
    "taskId": "abc123",
    "query": "Quantum Computing",
    "timestamp": "2026-04-04T12:00:00.000Z",
    "status": "completed"
  }
]
```

### GET `/api/research/results/:taskId`

Get the full stored results for a specific past research task.

**Response:**
```json
{
  "status": "completed",
  "report": { ... },
  "steps": [ ... ]
}
```

### GET `/api/research/status/:taskId`

Get the current status of a research task.

**Response:**
```json
{
  "status": "searching",
  "steps": [...],
  "report": {...}
}
```

### POST `/api/research/cache/clear`

Clear the content cache.

**Response:**
```json
{
  "message": "Cache cleared"
}
```

### WebSocket Connection

Connect to `ws://localhost:3000?taskId={taskId}` for real-time updates.

**Message Format:**
```json
{
  "status": "searching",
  "steps": [
    {
      "id": "step1",
      "type": "planning",
      "status": "completed",
      "message": "Created 5 research tasks.",
      "timestamp": "2026-04-04T12:00:00.000Z"
    }
  ]
}
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `TAVILY_API_KEY` | No | - | Tavily search API key (highly recommended) |
| `AGENT_MODEL` | No | `gemini-2.0-flash-exp` | AI model to use for all agents |
| `RESULTS_MAX_AGE_DAYS` | No | `7` | Days to keep research results before rotating |
| `CACHE_TTL` | No | `86400` | Content cache TTL in seconds (default 24h) |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, ERROR) |

### Research Configuration

| Option | Type | Default | Range | Description |
|--------|------|---------|-------|-------------|
| `maxIterations` | number | 3 | 1-10 | Maximum search-analyze cycles |
| `maxTimeSeconds` | number | 300 | 60-600 | Time limit in seconds |
| `budgetTokens` | number | 100000 | - | Token budget (not enforced) |
| `useFullPageFetch` | boolean | true | - | Enable deep content extraction |

## Error Handling

The application includes comprehensive error handling:

- **API Errors**: Automatic retry with exponential backoff
- **WebSocket Disconnections**: Auto-reconnection with visual feedback
- **Cache Failures**: Graceful degradation with logging
- **Invalid Responses**: Fallback to safe defaults
- **Network Issues**: User-friendly error messages

## Troubleshooting

### "GEMINI_API_KEY is not set"

Make sure you've created a `.env` file with your API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### WebSocket Connection Failed

- Check that the server is running on port 3000
- Ensure no firewall is blocking WebSocket connections
- The UI will automatically attempt to reconnect

### Search Returns No Results

- Try broadening your query
- Remove restrictive filters (domain restriction, date range)
- Check that your Tavily API key is valid (if using)
- Verify your internet connection

### Cache Issues

Clear the cache from the settings panel or manually delete the `research_results/cache` directory.

## Development

### Project Structure

```
deep-research-agent/
├── docs/                          # Documentation files
├── legacy/                        # Legacy code (Python version)
├── src/
│   ├── App.tsx                    # Main React component (History, UI, State)
│   ├── lib/
│   │   ├── agent/
│   │   │   ├── orchestrator.ts    # Main orchestration logic
│   │   │   ├── router.ts          # Logic dispatcher
│   │   │   ├── planner.ts         # Query decomposition
│   │   │   ├── searcher.ts        # Search & fetch consolidation
│   │   │   ├── analyzer.ts        # Content analysis
│   │   │   ├── synthesizer.ts     # Report synthesis
│   │   │   ├── types.ts           # Shared TypeScript types
│   │   │   └── __tests__/         # Unit testing suite (Planner, Analyzer, etc.)
│   │   └── utils/
│   │       ├── cache.ts           # Content caching & rotation
│   │       ├── retry.ts           # Exponential backoff utility
│   │       └── __tests__/         # Utility tests (Cache)
│   └── index.css                  # Styles
├── server.ts                      # Express + WebSocket server
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Running Tests

```bash
# Run unit tests
npm test

# Run linting
npm run lint
```

### Building for Production

```bash
npm run build
npm run preview
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Limitations

- Maximum report length limited by token constraints
- Search depth depends on Tavily API tier (if using)
- Cache TTL is fixed at 24 hours
- No support for multi-language research queries
- WebSocket may experience delays on slow connections

## Future Enhancements

- [ ] Multi-language support
- [ ] Export reports in PDF format
- [ ] Research history and comparison
- [ ] Collaborative research sessions
- [ ] Advanced visualization of research paths
- [ ] Integration with more search APIs
- [ ] Custom AI model selection

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Google Gemini for AI capabilities
- Tavily for advanced search API
- React and Tailwind CSS communities
- All contributors and testers

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Wiki](https://github.com/your-repo/wiki)

---

**Version**: 1.6.0  
**Last Updated**: April 4, 2026  
**Status**: Production Ready ✅
