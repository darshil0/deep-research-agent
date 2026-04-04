import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContentCache } from "../cache.ts";
import fs from "fs/promises";
import path from "path";

vi.mock("fs/promises");
vi.mock("path");

describe("ContentCache", () => {
    let cache: ContentCache;
  
    beforeEach(() => {
      vi.clearAllMocks();
      cache = new ContentCache(1000); // 1s TTL
      (path.join as any).mockImplementation((...args: string[]) => args.join("/"));
    });
  
    it("should return null if cache entry doesn't exist", async () => {
      (fs.readFile as any).mockRejectedValue(new Error("File not found"));
      const result = await cache.get("http://example.com");
      expect(result).toBeNull();
    });
  
    it("should set and get cache content", async () => {
      const content = "Test content";
      const writeSpy = vi.spyOn(fs, "writeFile").mockResolvedValue(undefined);
      const readSpy = vi.spyOn(fs, "readFile").mockResolvedValue(content);
      const mkdirSpy = vi.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
  
      await cache.set("http://example.com", content);
      expect(writeSpy).toHaveBeenCalled();
  
      const result = await cache.get("http://example.com");
      expect(result).toBe(content);
    });
  });
