// Branded ID types to enforce type safety across the system.

export type BatesID = string & { readonly __brand: "BatesID" };
export type CaseID = string & { readonly __brand: "CaseID" };

export type BatesNumber = string & { readonly __brand: "BatesNumber" };

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BatesRegion {
  readonly batesNumber: BatesNumber;
  readonly boundingBox: BoundingBox;
}

export interface AuditMetadata {
  readonly sourceCaseId: CaseID;
  readonly sourceBatesRegion: BatesRegion;
  readonly extractedAtIso: string;
}

export interface ExtractionResult<TPayload> {
  readonly id: BatesID;
  readonly payload: TPayload;
  readonly audit: AuditMetadata;
}

export interface AsyncBackoffSettings {
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly factor: number;
  readonly maxRetries: number;
}
