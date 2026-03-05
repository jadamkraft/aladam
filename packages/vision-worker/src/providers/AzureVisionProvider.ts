import type { AnalyzeResult } from "@azure/ai-form-recognizer";

import type {
  AsyncBackoffSettings,
  BatesID,
  BoundingBox,
  TraceID,
  SpanID,
  VisionOutput,
  VisionTextFragment
} from "@asymmetric-legal/types";
import { withExponentialBackoff } from "@asymmetric-legal/utils";
import type { StructuredLogger } from "@asymmetric-legal/utils";

import type { VisionProvider } from "./types.js";

export interface AnalysisPollerLike {
  pollUntilDone(): Promise<AnalyzeResult | undefined>;
}

export interface DocumentAnalysisClientLike {
  beginAnalyzeDocument(modelId: string, document: Buffer): Promise<AnalysisPollerLike>;
}

export interface AzureVisionProviderOptions {
  readonly client: DocumentAnalysisClientLike;
  readonly modelId: string;
  readonly backoffSettings: AsyncBackoffSettings;
  readonly logger: StructuredLogger;
}

export class AzureVisionProvider implements VisionProvider {
  private readonly client: DocumentAnalysisClientLike;

  private readonly modelId: string;

  private readonly backoffSettings: AsyncBackoffSettings;

  private readonly logger: StructuredLogger;

  constructor(options: AzureVisionProviderOptions) {
    this.client = options.client;
    this.modelId = options.modelId;
    this.backoffSettings = options.backoffSettings;
    this.logger = options.logger;
  }

  async analyzeDocument(
    batesId: BatesID,
    buffer: Buffer,
    traceId: TraceID,
    spanId: SpanID
  ): Promise<VisionOutput> {
    const scopedLogger = this.logger.withContext({
      batesId,
      traceId,
      spanId
    });

    scopedLogger.info("AzureVisionProvider: starting document analysis");

    const poller = await this.client.beginAnalyzeDocument(this.modelId, buffer);

    const result = await withExponentialBackoff(
      async () => {
        const analyzeResult = await poller.pollUntilDone();

        if (analyzeResult === undefined) {
          throw new Error("AzureVisionProvider: analyzeResult was undefined");
        }

        return analyzeResult;
      },
      this.backoffSettings,
      scopedLogger
    );

    const fragments = AzureVisionProvider.extractFragments(result);

    const fullText = result.content ?? fragments.map((fragment) => fragment.text).join(" ");

    scopedLogger.info("AzureVisionProvider: completed document analysis", {
      fragmentCount: fragments.length
    });

    return {
      batesId,
      fullText,
      fragments
    };
  }

  private static extractFragments(result: AnalyzeResult): readonly VisionTextFragment[] {
    const fragments: VisionTextFragment[] = [];

    const pages = result.pages ?? [];

    for (const page of pages) {
      const pageNumber = page.pageNumber ?? 0;

      const words = page.words ?? [];

      for (const word of words) {
        const polygon = word.polygon;

        if (polygon === undefined || polygon.length < 8) {
          continue;
        }

        const boundingBox = AzureVisionProvider.polygonToBoundingBox(polygon, pageNumber);

        const confidence = word.confidence ?? 1;

        fragments.push({
          text: word.content,
          boundingBox,
          pageNumber,
          confidence
        });
      }
    }

    return fragments;
  }

  private static polygonToBoundingBox(polygon: readonly number[], pageNumber: number): BoundingBox {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let index = 0; index + 1 < polygon.length; index += 2) {
      const x = polygon[index];
      const y = polygon[index + 1];

      if (x < minX) {
        minX = x;
      }

      if (y < minY) {
        minY = y;
      }

      if (x > maxX) {
        maxX = x;
      }

      if (y > maxY) {
        maxY = y;
      }
    }

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
      pageNumber
    };
  }
}

