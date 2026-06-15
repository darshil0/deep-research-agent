# Changelog

All notable changes to the Deep Research Agent project will be documented in this file.

## [1.9.0] - 2026-06-15

### Added

- **Code Formatting Infrastructure**: Integrated Prettier for consistent code style across the entire project. Added `npm run format` script.
- **Flat ESLint Configuration**: Migrated to ESLint 9.x flat configuration (`eslint.config.js`) for better compatibility with modern tooling.
- **Centralized Error Handling**: Implemented a robust error-handling middleware in the Express backend to ensure consistent API error responses.

### Changed

- **Major SDK Migration**: Upgraded to the latest `@google/generative-ai` SDK (v0.24.1). Refactored all agent modules (`Planner`, `Analyzer`, `Synthesizer`, `SearchProviders`) to use the new unified `getGenerativeModel()` API and `SchemaType` enums.
- **Dependency Refresh**: Updated all core dependencies and devDependencies to their latest stable versions, including `react` (v19.0.0), `vite` (v6.2.0), `vitest` (v4.1.9), and `typescript` (v5.8.3).
- **Test Suite Modernization**: Updated all unit tests to mock the new Google Generative AI SDK structures, ensuring a green test suite.

### Fixed

- **Type Safety**: Resolved numerous TypeScript errors related to implicit `any` types and missing module declarations for `ws`, `sonner`, `date-fns`, and others.
- **Documentation**: Renamed `Changelog.MD` to `CHANGELOG.md` for standard naming conventions.

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
