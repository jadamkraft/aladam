// Branded ID types to enforce type safety across the system.

export type BatesID = string & { readonly __brand: "BatesID" };
export type CaseID = string & { readonly __brand: "CaseID" };
export type AgentID = string & { readonly __brand: "AgentID" };
export type CarePlanVarianceID = string & { readonly __brand: "CarePlanVarianceID" };

export type TraceID = string & { readonly __brand: "TraceID" };
export type SpanID = string & { readonly __brand: "SpanID" };

export type BatesNumber = string & { readonly __brand: "BatesNumber" };

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly pageNumber: number;
}

export interface VisionTextFragment {
  readonly text: string;
  readonly boundingBox: BoundingBox;
  readonly pageNumber: number;
  readonly confidence: number;
}

export type ConfidenceScore = number & { readonly __brand: "ConfidenceScore" };

export interface VisionOutput {
  readonly batesId: BatesID;
  readonly fullText: string;
  readonly fragments: readonly VisionTextFragment[];
}

export interface BatesRegion {
  readonly batesNumber: BatesNumber;
  readonly boundingBox: BoundingBox;
}

export interface EvidenceProvenance {
  readonly batesId: BatesID;
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

export type VarianceCategory =
  | "medication"
  | "adl"
  | "nutrition"
  | "safety"
  | "other";

export interface CarePlanRequirementSnapshot {
  /**
   * Human-readable requirement from the Care Plan at the time of extraction.
   */
  readonly description: string;
  /**
   * Optional structured codes (e.g., SNOMED, RxNorm) associated with the requirement.
   */
  readonly codes?: readonly string[];
}

export type VarianceObservationStatus =
  | "present"
  | "missing"
  | "partial"
  | "unknown";

export interface CarePlanActualSnapshot {
  /**
   * Normalized description of what was actually found in discovery logs.
   */
  readonly description: string;
  /**
   * Status flag describing how the actual finding relates to the expected requirement.
   */
  readonly status: VarianceObservationStatus;
}

export interface CarePlanVariance {
  readonly id: CarePlanVarianceID;
  readonly caseId: CaseID;
  readonly category: VarianceCategory;
  readonly expected: CarePlanRequirementSnapshot;
  readonly actual: CarePlanActualSnapshot;
  readonly provenance: readonly EvidenceProvenance[];
}

export interface AsyncBackoffSettings {
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly factor: number;
  readonly maxRetries: number;
}
