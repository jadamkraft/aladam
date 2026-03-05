import fs from "node:fs/promises";
import path from "node:path";

import type { StructuredLogger } from "@asymmetric-legal/utils";
import { watch } from "chokidar";

import type { VisionIngestionService } from "./VisionIngestionService.js";

export interface DiscoveryInboxWatcherOptions {
  readonly inboxDir: string;
  readonly errorDir: string;
  readonly ingestionService: VisionIngestionService;
  readonly logger: StructuredLogger;
}

export class DiscoveryInboxWatcher {
  private readonly inboxDir: string;

  private readonly errorDir: string;

  private readonly ingestionService: VisionIngestionService;

  private readonly logger: StructuredLogger;

  private watcher:
    | {
        close(): Promise<void>;
      }
    | undefined;

  constructor(options: DiscoveryInboxWatcherOptions) {
    this.inboxDir = options.inboxDir;
    this.errorDir = options.errorDir;
    this.ingestionService = options.ingestionService;
    this.logger = options.logger;
  }

  start(): void {
    if (this.watcher !== undefined) {
      return;
    }

    this.logger.info("DiscoveryInboxWatcher: starting watcher", {
      inboxDir: this.inboxDir,
      errorDir: this.errorDir
    });

    const watcher = watch(this.inboxDir, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    watcher.on("add", (filePath) => {
      const relativePath = path.relative(this.inboxDir, filePath);

      const scopedLogger = this.logger.withContext({
        filePath,
        relativePath
      });

      scopedLogger.info("DiscoveryInboxWatcher: detected new file in inbox");

      void this.handleFile(filePath, scopedLogger);
    });

    watcher.on("error", (error) => {
      this.logger.error("DiscoveryInboxWatcher: watcher error", { error });
    });

    this.watcher = watcher;
  }

  async stop(): Promise<void> {
    if (this.watcher === undefined) {
      return;
    }

    await this.watcher.close();
    this.watcher = undefined;
  }

  private async handleFile(filePath: string, scopedLogger: StructuredLogger): Promise<void> {
    try {
      await this.ingestionService.ingestFile(filePath);
      scopedLogger.info("DiscoveryInboxWatcher: successfully ingested file");
    } catch (error) {
      scopedLogger.error(
        "DiscoveryInboxWatcher: ingestion failed, moving file to error directory",
        { error }
      );

      try {
        await fs.mkdir(this.errorDir, { recursive: true });

        const fileName = path.basename(filePath);
        const targetPath = path.join(this.errorDir, fileName);

        await fs.rename(filePath, targetPath);

        scopedLogger.info("DiscoveryInboxWatcher: moved file to error directory", {
          targetPath
        });
      } catch (moveError) {
        scopedLogger.error(
          "DiscoveryInboxWatcher: failed to move file to error directory",
          { originalError: error, moveError }
        );
      }
    }
  }
}

