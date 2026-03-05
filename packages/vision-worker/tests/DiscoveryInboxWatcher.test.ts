import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { AsyncBackoffSettings } from "@asymmetric-legal/types";
import { createStructuredLogger } from "@asymmetric-legal/utils";
import { describe, it, expect } from "vitest";

import { DiscoveryInboxWatcher } from "../src/DiscoveryInboxWatcher.js";
import { FileSystemStore } from "../src/FileSystemStore.js";
import { VisionIngestionService } from "../src/VisionIngestionService.js";
import type { VisionProvider } from "../src/providers/types.js";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

describe("DiscoveryInboxWatcher", () => {
  it("moves files from inbox to error directory when ingestion fails", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vision-worker-watcher-"));
    const inboxDir = path.join(rootDir, "inbox");
    const processedDir = path.join(rootDir, "processed");
    const errorDir = path.join(rootDir, "error");

    await Promise.all([
      fs.mkdir(inboxDir, { recursive: true }),
      fs.mkdir(processedDir, { recursive: true }),
      fs.mkdir(errorDir, { recursive: true })
    ]);

    const logger = createStructuredLogger(() => {
      // no-op sink for tests
    }, "debug");

    const failingProvider: VisionProvider = {
      async analyzeDocument() {
        throw new Error("Simulated vision provider failure");
      }
    };

    const backoffSettings: AsyncBackoffSettings = {
      initialDelayMs: 1,
      maxDelayMs: 1,
      factor: 1,
      maxRetries: 0
    };

    const fileSystemStore = new FileSystemStore(processedDir, logger);

    const ingestionService = new VisionIngestionService({
      visionProvider: failingProvider,
      fileSystemStore,
      backoffSettings,
      logger
    });

    const watcher = new DiscoveryInboxWatcher({
      inboxDir,
      errorDir,
      ingestionService,
      logger
    });

    try {
      watcher.start();

      // Give chokidar a moment to attach before writing the file.
      await delay(200);

      const fileName = "KRAFT-123.pdf";
      const inboxFilePath = path.join(inboxDir, fileName);
      const errorFilePath = path.join(errorDir, fileName);

      await fs.writeFile(inboxFilePath, "test content", "utf8");

      const timeoutMs = 10_000;
      const start = Date.now();

      let moved = false;

      while (Date.now() - start < timeoutMs) {
        const [inboxPresent, errorPresent] = await Promise.all([
          fileExists(inboxFilePath),
          fileExists(errorFilePath)
        ]);

        if (!inboxPresent && errorPresent) {
          moved = true;
          break;
        }

        await delay(200);
      }

      expect(moved).toBe(true);
    } finally {
      await watcher.stop();
      await fs.rm(rootDir, { recursive: true, force: true });
    }
  });
});

