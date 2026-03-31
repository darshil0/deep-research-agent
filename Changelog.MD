# Changelog

All notable changes to the Deep Research Agent project will be documented in this file.

## [1.3.0] - 2026-03-31

### Added
- **Robust API Resilience**: Implemented a generic `withRetry` utility with exponential backoff for all Gemini, Tavily, and web fetching operations, significantly reducing failures due to rate limits or transient network issues.
- **Decomposed Agent Architecture**: Refactored the monolithic research logic into specialized modules (`Planner`, `Searcher`, `Fetcher`, `Analyzer`, `Synthesizer`) for better modularity and maintainability.
- **Role-Based Agent Orchestration**: Introduced a `Router` and specialized agents (`SearchAgent`, `AnalysisAgent`, `SynthesisAgent`) to distinctly separate concerns and simplify the high-level research flow.
- **Intelligent Content Caching**: Implemented a file-based `ContentCache` with configurable TTL to store and reuse fetched web content, reducing redundant network requests and accelerating the research process.
- **Phase-Specific Orchestration**: Refactored the `ResearchOrchestrator` to use distinct, well-defined phases (`planPhase`, `researchPhase`, `synthesisPhase`), improving the clarity and robustness of the research lifecycle.

## [1.2.0] - 2026-03-31

### Added
- **Refined Dynamic Activity Log**: Updated the activity log to show real-time progress through specific stages: 'Planning', 'Searching', 'Fetching', and 'Synthesizing'.
- **Status Indicators**: Added visual status indicators (Active, Completed, Pending) to the activity log for better user feedback.
- **Real-time Timestamps**: Integrated real-time timestamps for each stage of the research process.

## [1.1.0] - 2026-03-31

### Added
- **Research History Sidebar**: Users can now view and revisit past research topics and reports.
- **Dynamic Activity Log**: Real-time logging of research stages (Planning, Searching, Extracting, etc.) with timestamps.
- **Historical Log Persistence**: Loading a past report now also restores the activity logs from that specific session.
- **Unique Research IDs**: Each research task is now stored in a unique, timestamped directory (`research_outputs/{timestamp}_{topic}`).
- **Inline Citations**: Research reports now include formatted inline citations `[Title](URL)`.
- **Enhanced Evidence Model**: Added `context` and `confidence` fields to evidence artifacts for better data granularity.
- **System Readiness Log**: Added a "SYSTEM_READY" status message on application initialization.

### Changed
- **Backend Path Handling**: Refactored `/api/results` and `/api/history` for robust directory traversal and file retrieval.
- **Progress Simulation**: Improved the frontend progress bar logic to be more deterministic and synchronized with stage logs.
- **Theme Management**: Refined the light/dark mode toggle with persistent storage in `localStorage`.

### Fixed
- **Activity Log Placeholders**: Resolved the issue where "SYSTEM_IDLE" would persist or appear incorrectly.
- **Path Resolution Errors**: Fixed backend bugs related to finding the most recent research output when no ID was provided.
- **TypeScript Type Safety**: Added missing event types and interface definitions for better development stability.

## [1.0.0] - 2026-03-30

### Initial Release
- Core research agent functionality.
- Web search integration (simulated).
- Basic report generation and artifact extraction.
- Initial Tailwind CSS UI implementation.
