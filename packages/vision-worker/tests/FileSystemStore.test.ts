import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type {
  BatesID,
  TraceID,
  SpanID,
  VisionOutput,
  VisionTextFragment
} from "@asymmetric-legal/types";
import { createStructuredLogger } from "@asymmetric-legal/utils";
import { describe, it, expect } from "vitest";

import { FileSystemStore } from "../src/FileSystemStore.js";
import type { VisionIngestionRecord } from "../src/FileSystemStore.js";

describe("FileSystemStore", () => {
  it("wraps VisionOutput in VisionIngestionRecord and writes pretty-printed JSON", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "vision-worker-store-"));
    const processedDir = path.join(rootDir, "processed");

    await fs.mkdir(processedDir, { recursive: true });

    const logger = createStructuredLogger(() => {
      // no-op sink for tests
    }, "debug");

    const store = new FileSystemStore(processedDir, logger);

    const fragments: readonly VisionTextFragment[] = [];

    const vision: VisionOutput = {
      batesId: "KRAFT-123" as BatesID,
      fullText: "example full text",
      fragments
    };

    const record: VisionIngestionRecord = {
      vision,
      traceId: "trace-id-123" as TraceID,
      spanId: "span-id-456" as SpanID,
      sourcePath: "/tmp/KRAFT-123.pdf",
      ingestedAtIso: new Date().toISOString()
    };

    const outputPath = await store.saveVisionResult(record);

    expect(outputPath).toBe(path.join(processedDir, `${vision.batesId}.json`));

    const raw = await fs.readFile(outputPath, "utf8");

    // Ensure the JSON is pretty-printed (multi-line with indentation).
    const lineCount = raw.trim().split("\n").length;
    expect(lineCount).toBeGreaterThan(1);
    expect(raw).toContain('\n  "vision":');

    const parsed = JSON.parse(raw) as VisionIngestionRecord;
    expect(parsed).toEqual(record);
  });
});

