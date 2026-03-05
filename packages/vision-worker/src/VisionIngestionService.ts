import fs from "node:fs/promises";

import type { AsyncBackoffSettings } from "@asymmetric-legal/types";
import { generateSpanId, generateTraceId, withExponentialBackoff } from "@asymmetric-legal/utils";
import type { StructuredLogger } from "@asymmetric-legal/utils";

import { batesIdFromFilename } from "./batesIdFromFilename.js";
import type { FileSystemStore, VisionIngestionRecord } from "./FileSystemStore.js";
import type { VisionProvider } from "./providers/types.js";

export interface VisionIngestionServiceOptions {
  readonly visionProvider: VisionProvider;
  readonly fileSystemStore: FileSystemStore;
  readonly backoffSettings: AsyncBackoffSettings;
  readonly logger: StructuredLogger;
}

export class VisionIngestionService {
  private readonly visionProvider: VisionProvider;

  private readonly fileSystemStore: FileSystemStore;

  private readonly backoffSettings: AsyncBackoffSettings;

  private readonly logger: StructuredLogger;

  constructor(options: VisionIngestionServiceOptions) {
    this.visionProvider = options.visionProvider;
    this.fileSystemStore = options.fileSystemStore;
    this.backoffSettings = options.backoffSettings;
    this.logger = options.logger;
  }

  async ingestFile(filePath: string): Promise<void> {
    const batesId = batesIdFromFilename(filePath);
    const traceId = generateTraceId();
    const spanId = generateSpanId();

    const scopedLogger = this.logger.withContext({
      traceId,
      spanId,
      batesId,
      filePath
    });

    scopedLogger.info("VisionIngestionService: starting ingestion for file");

    await withExponentialBackoff(
      async () => {
        const buffer = await fs.readFile(filePath);

        const vision = await this.visionProvider.analyzeDocument(
          batesId,
          buffer,
          traceId,
          spanId
        );

        const record: VisionIngestionRecord = {
          vision,
          traceId,
          spanId,
          sourcePath: filePath,
          ingestedAtIso: new Date().toISOString()
        };

        await this.fileSystemStore.saveVisionResult(record);

        scopedLogger.info("VisionIngestionService: completed ingestion for file", {
          fragmentCount: vision.fragments.length
        });
      },
      this.backoffSettings,
      scopedLogger
    );
  }
}

