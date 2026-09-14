# Changelog

All notable changes to the Deep Research Agent project will be documented in this file.

## [Unreleased]

### Fixed

- **CI/CD Pipeline Security Scanning**: Corrected flag ordering in `git grep` secret detection step within `.github/workflows/main.yml`.
- **CI/CD Dependency Installation**: Added `--legacy-peer-deps` to the `npm ci` step in GitHub Actions to resolve peer dependency resolution errors with ESLint 10.
- **Dependency Security Vulnerabilities**: Resolved production dependency audit vulnerabilities across `nanoid`, `postcss`, and `undici` in `package-lock.json`.

---


## [1.9.0] - 2026-09-13

### Added

- **Code Formatting Infrastructure**: Integrated Prettier for consistent code style across the entire project. Added `npm run format` script.
- **Flat ESLint Configuration**: Migrated to ESLint 9.x flat configuration (`eslint.config.js`) for better compatibility with modern tooling.
- **Centralized Error Handling**: Implemented a robust error-handling middleware in the Express backend to ensure consistent API error responses.

### Changed

- **Major SDK Migration**: Upgraded to the latest `@google/generative-ai` SDK (v0.24.1). Refactored all agent modules (`Planner`, `Analyzer`, `Synthesizer`, `SearchProviders`) to use the new unified `getGenerativeModel()` API and `SchemaType` enums.
- **Dependency Refresh**: Updated all core dependencies and devDependencies to their latest stable versions, including `react` (v19.0.0), `vite` (v6.2.0), `vitest` (v4.1.9), and `typescript` (v5.8.3).
- **Test Suite Modernization**: Updated all unit tests to mock the new Google Generative AI SDK structures, ensuring a green test suite.

### Fixed

- **Type Safety & Linting**: Resolved all ESLint warnings and unused parameter/import issues across `server.ts`, `App.tsx`, agent modules (`orchestrator`, `analyzer`, `planner`, `searcher`, `synthesizer`), utilities (`ai`, `cache`), and unit tests.
- **React Hook Dependencies**: Refactored React hooks (`useEffect`, `useCallback`) in `App.tsx` for proper dependency tracking and WebSocket lifecycle management.
- **Backend Error Handling**: Added 404 responses for non-existent research results in `/api/research/results/:taskId` and defensive fallback handling for background research task failures in `/api/research/start`.
- **Project Metadata & Versioning**: Synchronized project version `1.9.0` and package name `deep-research-agent` across `package.json`, `App.tsx` header UI, and `README.md`.

---

## [1.8.0] - 2026-05-31

### Added

- **Production Deployment Guides**: Added comprehensive infrastructure deployment guides for Docker, AWS, GCP, and Azure.
- **Cost Estimation & Tracking**: Implemented automated API budget estimation and cost tracking per individual research task.

### Fixed

- **Documentation File Paths**: Fixed hardcoded file path issues within the setup and deployment documentation.

### Improved

- **Error Handling & Recovery**: Implemented comprehensive error handling and graceful degradation strategies across all core modules.
- **Circuit Breaker Pattern**: Integrated a circuit breaker mechanism to automatically throttle and manage failed search providers.
- **WebSocket Reconnection**: Enhanced real-time communication resilience with exponential backoff on WebSocket reconnection routines.
- **Security & Token Lifecycle**: Improved security architecture documentation and backend token lifecycle management.

[... previous entries omitted for brevity ...]
