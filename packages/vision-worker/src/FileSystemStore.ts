import fs from "node:fs/promises";
import path from "node:path";

import type { TraceID, SpanID, VisionOutput } from "@asymmetric-legal/types";
import type { StructuredLogger } from "@asymmetric-legal/utils";

export interface VisionIngestionRecord {
  readonly vision: VisionOutput;
  readonly traceId: TraceID;
  readonly spanId: SpanID;
  readonly sourcePath: string;
  readonly ingestedAtIso: string;
}

export class FileSystemStore {
  private readonly processedDir: string;

  private readonly logger: StructuredLogger;

  constructor(processedDir: string, logger: StructuredLogger) {
    this.processedDir = processedDir;
    this.logger = logger;
  }

  async saveVisionResult(record: VisionIngestionRecord): Promise<string> {
    const { vision } = record;

    const fileName = `${vision.batesId}.json`;
    const outputPath = path.join(this.processedDir, fileName);

    await fs.mkdir(this.processedDir, { recursive: true });

    const contents = JSON.stringify(record);

    await fs.writeFile(outputPath, contents, "utf8");

    this.logger.info("FileSystemStore: saved vision ingestion record", {
      batesId: vision.batesId,
      outputPath
    });

    return outputPath;
  }
}

