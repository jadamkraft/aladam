---
name: shared-utils-resilience-utilities
overview: Add a structured JSON logger with legal IDs and a generic async backoff helper using AsyncBackoffSettings in the shared utils package.
todos:
  - id: define-log-types
    content: Define `LogContext`, `StructuredLogger`, and update `Logger` interface in shared/utils to accept typed legal identifiers in log contexts.
    status: completed
  - id: implement-structured-logger
    content: Implement `createStructuredLogger` and refactor `createConsoleLogger` to use it for JSON log output.
    status: completed
  - id: implement-withBackoff
    content: Implement generic `withBackoff<T>` using `AsyncBackoffSettings` with exponential backoff and jitter.
    status: completed
  - id: unify-backoff-helpers
    content: Refactor existing `withExponentialBackoff` to share core backoff logic with the new `withBackoff` while keeping its signature.
    status: completed
  - id: export-utilities
    content: Ensure all new logger and backoff utilities are exported from shared/utils/src/index.ts and pass type checks.
    status: completed
isProject: false
---

### Goals

- **Structured FDE Logger**: Provide a lightweight, JSON-structured logger that can consistently carry `BatesID`/`CaseID` metadata for traceability in logs.
- **Async Backoff Utility**: Provide a generic `withBackoff` helper using `AsyncBackoffSettings` with exponential backoff and jitter for handling rate limits (e.g. Azure OpenAI, Supabase).
- **Type Safety**: Keep the implementation strictly typed (Zero-Any) and compatible with existing ESM setup.

### Files to Inspect / Modify

- **Types**: `[shared/types/src/index.ts](shared/types/src/index.ts)`
  - Reuse existing branded types: `BatesID`, `CaseID`, and `AsyncBackoffSettings`.
- **Utils**: `[shared/utils/src/index.ts](shared/utils/src/index.ts)`
  - Extend the existing logger and backoff helpers to meet the new requirements and export the new utilities from here.

### Implementation Plan

- **1. Define structured logging types in `shared/utils`**
  - Import `BatesID` and `CaseID` from `@shared/types/src/index.js`.
  - Introduce a `LogContext` type that:
    - Has optional `batesId?: BatesID` and `caseId?: CaseID` properties.
    - Allows additional structured fields via `Record<string, unknown>` without using `any`.
  - Update the existing `Logger` interface to accept `LogContext` instead of a generic `Record<string, unknown>` for the `context` parameter, ensuring every log method can optionally receive legal identifiers.
- **2. Implement the Structured FDE Logger factory**
  - Define a `StructuredLogger` interface that extends `Logger` and may support `withContext(bound: LogContext): StructuredLogger` for cheaply binding recurring metadata (e.g. per-case loggers).
  - Implement a generic factory, e.g. `createStructuredLogger`, that:
    - Takes a JSON sink function like `(record: Readonly<Record<string, unknown>>) => void` and a `LogLevel`.
    - Performs level filtering using the existing `LogLevel` ordering.
    - Builds a structured payload for each log entry with fields such as `timestamp`, `level`, `message`, and spreads in `LogContext`, guaranteeing JSON-serializable output.
    - Calls the sink with the structured object, leaving the sink responsible for encoding (e.g. `JSON.stringify`).
  - Refactor `createConsoleLogger` to:
    - Use `createStructuredLogger` with a sink that does `console.log(JSON.stringify(record))`.
    - Preserve current behavior (stdout JSON lines suitable for K8s/CloudWatch) while now formally supporting `batesId` and `caseId` in the log context.
  - Export both `Logger`/`StructuredLogger`, `LogContext`, `createStructuredLogger`, and `createConsoleLogger` from `shared/utils/src/index.ts`.
- **3. Implement generic async backoff with jitter**
  - Implement `withBackoff<T>(fn: () => Promise<T>, settings: AsyncBackoffSettings): Promise<T>` in `shared/utils/src/index.ts` that:
    - Uses `initialDelayMs`, `maxDelayMs`, `factor`, and `maxRetries` from `AsyncBackoffSettings`.
    - On failure, increments an attempt counter and, if `attempt > maxRetries`, rethrows the last error.
    - Computes the next delay using exponential backoff with full jitter (e.g. draw a uniform random in `[0, currentDelay]`, then multiply by `factor` and clamp to `maxDelayMs`).
    - Awaits a `setTimeout`-backed `Promise` for the computed delay between attempts.
  - Keep the implementation strictly typed (`T`, `unknown` where needed) without any `any` usage.
  - Optionally, implement an internal helper that both `withBackoff` and the existing `withExponentialBackoff` can share so that jitter logic is consistent.
- **4. Maintain or adapt existing backoff helper**
  - Preserve the existing `withExponentialBackoff` signature for compatibility, but refactor its internals to delegate to the new jitter-aware core where feasible, so it benefits from the same retry behavior.
  - Ensure that any existing consumers (e.g. worker code) remain type-safe and continue compiling; in a follow-up change, these can be migrated to use `withBackoff` directly if desired.
- **5. Exports and validation**
  - Confirm that all new utilities are exported from `shared/utils/src/index.ts`:
    - `Logger`, `StructuredLogger`, `LogContext`.
    - `createStructuredLogger`, `createConsoleLogger`.
    - `withBackoff` (and `withExponentialBackoff` for backward compatibility).
  - Run TypeScript compilation / lints (when enabled) to verify there is no `any` usage and that ESM imports (`@shared/types/src/index.js`) remain valid.

### Optional Follow-Up (post-core implementation)

- **Update call sites** (e.g. `packages/vision-worker/src/main.ts`) to:
  - Start passing `batesId` and/or `caseId` in logger contexts where appropriate once those IDs are available.
  - Consider migrating from `withExponentialBackoff` to `withBackoff` to standardize on the new API and jitter behavior.
