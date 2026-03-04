---
name: legal-intel-core-types
overview: Extend the shared types package with core domain models for the Asymmetric Legal Intelligence System, including branded IDs, bounding boxes, evidence provenance, and care plan variance modeling.
todos:
  - id: add-branded-ids
    content: Add AgentID and CarePlanVarianceID branded string types to shared/types/src/index.ts near existing BatesID and CaseID definitions.
    status: pending
  - id: update-bounding-box
    content: Update BoundingBox in shared/types/src/index.ts to include pageNumber and align fields to x, y, w, h, pageNumber as readonly numbers.
    status: pending
  - id: add-evidence-provenance
    content: Add EvidenceProvenance interface tying a BatesID and BoundingBox to an extracted value in shared/types/src/index.ts.
    status: pending
  - id: add-careplan-variance
    content: Define VarianceCategory union and CarePlanVariance interface using branded IDs and EvidenceProvenance in shared/types/src/index.ts.
    status: pending
  - id: verify-zero-any
    content: Confirm shared/types/src/index.ts remains free of any and uses only ESM-style type/interface exports after changes.
    status: pending
isProject: false
---

### Goals

- **Introduce new branded ID types** for `AgentID` and `CarePlanVarianceID` to prevent ID swapping.
- **Refine and extend geometric and provenance types** to include `BoundingBox` with page context and `EvidenceProvenance` for extracted values.
- **Define a strictly typed `CarePlanVariance` model** that uses branded IDs, a string-union category, and provenance references.
- **Keep the shared types package ESM-compliant and Zero-Any**, building on the existing patterns already present in `shared/types`.

### Current context

- **Existing branded IDs and types** in `[shared/types/src/index.ts](shared/types/src/index.ts)`:

```1:37:shared/types/src/index.ts
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
```

- **Module setup** is already ESM-oriented with a Zero-Any style (no `any`, exported types/interfaces only) in `shared/types`.

### Planned changes

- **1. Add new branded ID types**
  - **What**: Define `AgentID` and `CarePlanVarianceID` as branded string types, alongside the existing `BatesID` and `CaseID`.
  - **How**: In `shared/types/src/index.ts`, near the current branded IDs, add:
    - `export type AgentID = string & { readonly __brand: "AgentID" };`
    - `export type CarePlanVarianceID = string & { readonly __brand: "CarePlanVarianceID" };`
  - **Why**: Maintains consistency with current branding strategy while preventing accidental ID swapping between cases, agents, and variances.
- **2. Extend BoundingBox to include pageNumber**
  - **What**: Update the existing `BoundingBox` interface to include a `readonly pageNumber: number` property, and align field names with the requested shape.
  - **How**:
    - Either change `width`/`height` to `w`/`h` or add `pageNumber` while keeping current names; to match your request, we’ll adjust fields to exactly `x`, `y`, `w`, `h`, and `pageNumber` as `number`.
    - Preserve readonly modifiers for immutability.
  - **Why**: Your legal intelligence system needs page-aware geometry for each visual evidence reference; aligning with the requested API reduces friction for downstream services.
- **3. Introduce EvidenceProvenance**
  - **What**: Define an `EvidenceProvenance` interface that ties any extracted value back to a `BatesID` and a `BoundingBox`.
  - **How**:
    - Add a zero-any, generic-friendly interface such as:
      - `readonly batesId: BatesID;`
      - `readonly boundingBox: BoundingBox;`
      - Optionally, a `readonly fieldName: string` if you later want to distinguish which logical field the evidence supports (kept as string to stay flexible and typed at higher layers).
  - **Why**: This provides a reusable provenance primitive that other domain models can leverage, especially `CarePlanVariance`.
- **4. Define CarePlanVariance domain model**
  - **What**: Create a `VarianceCategory` string-union and a `CarePlanVariance` interface that uses branded IDs and provenance.
  - **How** in `shared/types/src/index.ts`:
    - Add a category union type, e.g.:
      - `export type VarianceCategory = "medication" | "adl" | "nutrition" | "safety" | "other";`
    - Define the `CarePlanVariance` interface with strictly typed fields:
      - `readonly id: CarePlanVarianceID;`
      - `readonly caseId: CaseID;` (explicit link back to the parent case, per your example)
      - `readonly category: VarianceCategory;`
      - `readonly expected: string;` (care plan requirement text or normalized description)
      - `readonly actual: string;` (what discovery logs show; can be empty or a specific sentinel string when missing)
      - `readonly provenance: readonly EvidenceProvenance[];`
  - **Why**: This gives you a central, high-integrity representation of care plan discrepancies that downstream services (UI, reporting, reconciliation engines) can depend on.
- **5. Maintain ESM and Zero-Any guarantees**
  - **What**: Ensure all additions are exported as `export type` or `export interface` with no `any` usage and no CommonJS artifacts.
  - **How**:
    - Keep using declaration-only exports in `index.ts`.
    - Avoid introducing runtime constructs; this file remains purely type-level.
    - No changes needed to `shared/types/tsconfig.json` since it already compiles `src` to `dist` with the base config.
  - **Why**: Preserves the existing architecture of `shared/types` as a pure type package usable across all ESM subprojects.

### Todos

- **add-branded-ids**: Add `AgentID` and `CarePlanVarianceID` branded types to `shared/types/src/index.ts` alongside existing ID types.
- **update-bounding-box**: Update `BoundingBox` to use `x`, `y`, `w`, `h`, and `pageNumber` while preserving readonly semantics.
- **add-evidence-provenance**: Introduce the `EvidenceProvenance` interface bound to `BatesID` and `BoundingBox`.
- **add-careplan-variance**: Define `VarianceCategory` and `CarePlanVariance` with branded IDs, expected/actual strings, and provenance array, and export them from the shared types package.
- **verify-zero-any**: Quickly re-scan `shared/types/src/index.ts` to confirm no `any` usage and that all exports remain ESM-style.
