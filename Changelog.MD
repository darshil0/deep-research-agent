# Changelog

All notable changes to the Deep Research Agent project will be documented in this file.

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
