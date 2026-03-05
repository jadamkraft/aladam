import type {
  BatesID,
  BoundingBox,
  TraceID,
  SpanID,
  VisionOutput,
  ConfidenceScore
} from "@asymmetric-legal/types";

export interface VisionProvider {
  analyzeDocument(
    batesId: BatesID,
    buffer: Buffer,
    traceId: TraceID,
    spanId: SpanID
  ): Promise<VisionOutput>;
}

export interface HandwritingProvider {
  analyzeHandwriting(
    buffer: Buffer,
    targets: readonly BoundingBox[],
    traceId: TraceID,
    spanId: SpanID
  ): Promise<ConfidenceScore>;
}

