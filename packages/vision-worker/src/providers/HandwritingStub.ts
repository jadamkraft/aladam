import type {
  BoundingBox,
  ConfidenceScore,
  TraceID,
  SpanID
} from "@asymmetric-legal/types";
import type { StructuredLogger } from "@asymmetric-legal/utils";

import type { HandwritingProvider } from "./types.js";

export interface HandwritingStubOptions {
  readonly logger: StructuredLogger;
}

export class HandwritingStub implements HandwritingProvider {
  private readonly logger: StructuredLogger;

  constructor(options: HandwritingStubOptions) {
    this.logger = options.logger;
  }

  async analyzeHandwriting(
    buffer: Buffer,
    targets: readonly BoundingBox[],
    traceId: TraceID,
    spanId: SpanID
  ): Promise<ConfidenceScore> {
    const scopedLogger = this.logger.withContext({
      traceId,
      spanId,
      targetCount: targets.length,
      approximateBytes: buffer.byteLength
    });

    scopedLogger.info("HandwritingStub: simulating PyTorch checkmark inference");

    const base = Math.min(1, buffer.byteLength / 4096);
    const targetAdjustment = targets.length > 0 ? 0.1 : 0;
    const rawScore = Math.min(1, base + targetAdjustment);

    const score = rawScore as ConfidenceScore;

    scopedLogger.debug("HandwritingStub: produced synthetic confidence score", {
      confidenceScore: score
    });

    return score;
  }
}

