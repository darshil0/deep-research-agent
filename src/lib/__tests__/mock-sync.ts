/**
 * Shared test utilities for smoke tests
 */
import { vi } from "vitest";

export const mockSync = {
  syncToAll: vi.fn().mockResolvedValue({
    totalCreated: 8,
    github: { created: 5, skipped: 0, failed: [], epics: {} },
    jira: { created: 3, skipped: 0, failed: [], epics: {} },
    timestamp: new Date().toISOString(),
  }),
  healthCheck: vi.fn().mockResolvedValue([
    { service: "GitHub", healthy: true },
    { service: "Jira", healthy: true },
  ]),
  pullUpdates: vi.fn().mockImplementation(async (p) => p),
};
