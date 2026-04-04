# Changelog

All notable changes to the Deep Research Agent project will be documented in this file.

## [1.6.0] - 2026-04-04

### Added
- **Advanced History Sidebar**: Implemented a premium, collapsible history sidebar with chronological grouping ("Today", "Yesterday", "Earlier") and active task states.
- **State Persistence & Resilience**: Added `localStorage` persistence for research tasks, allowing for automatic reconnection and state restoration after browser refreshes.
- **Unit Testing Suite**: Established a comprehensive testing framework using Vitest, including unit tests for `Planner`, `Analyzer`, `Synthesizer`, and `ContentCache`.
- **Multi-Environment Configuration**: Added `.env.example` with detailed documentation for all new configuration options (TTL, Rotation, Model).
- **Backend API Extensions**: Added new REST endpoints for history listing and individual task retrieval to support the frontend history management.

### Changed
- **Major Architecture Refactoring**: Simplified agent architecture by removing redundant `SearchAgent`, `AnalysisAgent`, and `SynthesisAgent` wrappers, moving core logic directly into `Searcher`, `Analyzer`, and `Synthesizer`.
- **Flexible Model Selection**: Introduced environment-based model selection via `AGENT_MODEL`, with enhanced fallback logic to `gemini-2.0-flash-exp`.
- **Research Results Rotation**: Implemented a server-side rotation policy to automatically clean up research results older than 7 days (configurable via `RESULTS_MAX_AGE_DAYS`).
- **Cache Configuration**: Made the `ContentCache` TTL configurable via the `CACHE_TTL` environment variable.

### Improved
- **UI Performance**: Optimized the sidebar and activity log for better responsiveness and smoother transitions using `framer-motion`.
- **Error Propagation**: Enhanced the `Router` and `Orchestrator` to provide more granular error details during task failures.

## [1.5.1] - 2026-04-04

### Changed
- **Project Structure Reorganization**: Cleaned up the project root by moving all Python-related files and directories to `legacy/python-version/`.
- **Documentation Organization**: Moved `BUG_FIX_SUMMARY.md` to the `docs/` directory.
- **Redundant File Cleanup**: Removed several redundant TypeScript files from the root that were already present in the `src/` directory.

### Improved
- **Dependency Updates**: Updated all core libraries and devDependencies to their latest stable versions for improved security and performance.
- **Version Bump**: Updated application version to 1.5.1 to reflect structural and dependency improvements.

## [1.5.0] - 2026-04-04

### Fixed
- **Critical Model Name Bug**: Corrected all AI model references from non-existent `gemini-3-flash-preview` to the correct `gemini-2.0-flash-exp` model across all agent modules (Planner, Analyzer, Synthesizer, Searcher).
- **Error Handling**: Added comprehensive try-catch blocks and error boundaries throughout the orchestrator, agent modules, and UI components to prevent crashes and improve resilience.
- **Type Safety**: Improved TypeScript type checking with proper null guards, array validation, and type assertions in orchestrator, analyzer, and synthesizer modules.
- **Cache Robustness**: Enhanced ContentCache with automatic directory creation, proper error handling for read/write operations, and cleanup of expired entries.
- **WebSocket Stability**: Implemented automatic reconnection logic with exponential backoff, connection state tracking, and error notifications in the UI.
- **API Key Validation**: Added explicit validation of GEMINI_API_KEY before orchestrator initialization with clear error messages.
- **Date Range Filtering**: Completed implementation of time-based search filtering using Tavily's native `days` parameter with proper mapping for day/week/month/year ranges.
- **Citation Consistency**: Improved citation formatting in synthesizer with better source-to-citation mapping and validation of report structure.
- **State Management**: Enhanced orchestrator state updates with proper error propagation and step completion tracking.
- **UI Accessibility**: Added proper ARIA labels, input validation, error states, and keyboard navigation support throughout the interface.

### Improved
- **Error Messages**: All error messages now include actionable information and proper context for debugging.
- **Loading States**: Enhanced loading indicators with better visual feedback during long-running operations.
- **Mobile Responsiveness**: Fixed several responsive design issues in the settings panel and report display.
- **Cache Statistics**: Added cache statistics tracking method for monitoring cache usage and size.
- **Version Bump**: Updated application version to 1.5.0 to reflect the comprehensive bug fixes and improvements.

### Changed
- **Model Configuration**: Standardized on `gemini-2.0-flash-exp` as the default model across all AI operations.
- **Retry Logic**: Improved retry mechanism to properly identify transient errors vs permanent failures.
- **Validation**: Added input validation for config parameters (max iterations, time limits) with sensible min/max bounds.

## [1.4.0] - 2026-03-31

### Added
- **Advanced Search Filters**: Integrated comprehensive search filtering capabilities (date range, domain restriction, keyword exclusion) into both the backend (`Searcher`, `SearchAgent`) and the frontend UI (`App.tsx`).
- **Tavily Time-Based Filtering**: Optimized the `Searcher` to utilize Tavily's native `days` parameter for more accurate time-restricted searches.
- **Query Engineering for Filters**: Implemented automatic query modification to append advanced search operators (`site:`, `-`) based on user-defined filters for both Tavily and Google Search grounding.

### Improved
- **Prompt Engineering & Few-Shot Examples**: Significantly refined the prompts for the `Planner`, `Analyzer`, and `Synthesizer` agents, adding detailed instructions, guidelines, and few-shot examples to improve output quality, consistency, and report structure.
- **UI Settings Panel**: Expanded the research settings panel with intuitive controls for all new search filters, including a date range dropdown and text inputs for domain and keyword restrictions.

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
