---
name: asymmetric-legal-intel-monorepo
overview: Scaffold a K8s-native Node 22 ESM/TypeScript monorepo for the Asymmetric Legal Intelligence System using pnpm workspaces, with microservices, shared libraries, and infra layout for Helm and Docker.
todos:
  - id: root-structure-and-configs
    content: "Define root monorepo layout (`packages/`, `shared/`, `infra/`) and create root configs: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, and README."
    status: pending
  - id: shared-libs
    content: Scaffold `shared/types` and `shared/utils` as TypeScript ESM packages with strict configs, branded ID types, and basic utilities (logging, backoff).
    status: pending
  - id: services-scaffold
    content: Create TypeScript ESM service packages for `vision-worker`, `agent-orchestrator`, and `data-api` with `src/`, `tests/`, `Dockerfile`, `package.json`, and `tsconfig.json`.
    status: pending
  - id: infra-helm-docker
    content: Set up `infra/helm/charts` with initial charts per service and `infra/docker` with shared Docker/deployment helpers.
    status: pending
  - id: tooling-and-docs
    content: Add linting, testing configs, and document workflows in README, plus root scripts to orchestrate builds/tests across workspaces.
    status: pending
isProject: false
---

## Monorepo structure

- **Root layout**
  - Create the following top-level folders:
    - `packages/` for all microservices
    - `shared/` for cross-cutting libraries (types, utils)
    - `infra/` for deployment artefacts
  - Add root configs:
    - `[package.json](package.json)` configured for **pnpm workspaces**, Node 22, ESM, and TypeScript tooling
    - `[pnpm-workspace.yaml](pnpm-workspace.yaml)` listing `packages/*` and `shared/*`
    - `[tsconfig.base.json](tsconfig.base.json)` with strict TypeScript settings and path aliases for shared modules
    - Optional meta files: `[README.md](README.md)`, `.editorconfig`, `.gitignore` tuned for Node/TS/infra
- **Workspace configuration (pnpm + Node 22 ESM)**
  - In `[package.json](package.json)`:
    - Set `private: true`
    - Set `engines.node` to `>=22`
    - Configure `workspaces` for pnpm (or rely on `pnpm-workspace.yaml` while still documenting the structure)
    - Add scripts: `build`, `test`, `lint`, `format`, and per-service helpers via `pnpm -C <pkg>` as needed
  - In `[pnpm-workspace.yaml](pnpm-workspace.yaml)`:
    - Include workspace patterns: `packages/*` and `shared/*`
  - In `[tsconfig.base.json](tsconfig.base.json)`:
    - Enable strict TypeScript (`strict: true`, noImplicitAny, etc.)
    - Target modern Node (e.g., `module: node16` or `nodeNext`, `moduleResolution: node16|nodeNext`, `target: ES2022`)
    - Configure composite/incremental builds if we want project references later
- **Shared libraries (`shared/`)**
  - Create `[shared/types/package.json](shared/types/package.json)` and `[shared/types/tsconfig.json](shared/types/tsconfig.json)`:
    - ESM, TypeScript entrypoints (e.g., `exports` map), and `types` field
    - Initial domain models: branded ID types like `BatesID`, `CaseID` and basic shared result types
  - Create `[shared/utils/package.json](shared/utils/package.json)` and `[shared/utils/tsconfig.json](shared/utils/tsconfig.json)`:
    - Utilities for logging, exponential backoff, and common error types (aligned with "Auditability First" and resilience mandates)
  - Ensure `paths` in `[tsconfig.base.json](tsconfig.base.json)` map aliases like `@shared/types` and `@shared/utils` to these packages for all services.
- **Service scaffolds under `packages/`**
  - For each service (`vision-worker`, `agent-orchestrator`, `data-api`) create:
    - `packages/<service>/src/` with minimal entrypoint (e.g., `index.ts` or `main.ts`) wired for ESM and TypeScript
    - `packages/<service>/tests/` with a placeholder test file and test runner setup (e.g., Vitest or Jest configured at root)
    - `packages/<service>/Dockerfile` using Node 22, multi-stage build (builder + runtime), and pnpm for dependencies
    - `packages/<service>/package.json`:
      - `type: "module"`, `main`, `exports`, `types`
      - Service-specific dependencies (HTTP framework, queue client, etc. left as minimal placeholders)
      - Scripts: `dev`, `build`, `start`, `test`
    - `packages/<service>/tsconfig.json` extending `[tsconfig.base.json](tsconfig.base.json)` with appropriate `outDir` and `rootDir`
  - Wire intra-repo dependencies so services depend on `@shared/types` and `@shared/utils` where appropriate.
- **Infra directory (`infra/`)**
  - Create Helm layout under `[infra/helm/charts](infra/helm/charts)`:
    - Either one umbrella chart `infra/helm/charts/aladam/` with subcharts for each service, or individual charts per service (plan for one chart per service initially for clarity):
      - `infra/helm/charts/vision-worker/`
      - `infra/helm/charts/agent-orchestrator/`
      - `infra/helm/charts/data-api/`
    - Each chart includes:
      - `Chart.yaml`, `values.yaml`, `templates/deployment.yaml`, `templates/service.yaml`, and placeholders for HPA and config maps
      - Pod spec annotations allowing future wiring of auditability (e.g., log config, env vars for SUPABASE/Azure)
  - Create Docker helper area under `[infra/docker](infra/docker)`:
    - Optional shared `docker-compose.dev.yaml` or a README describing local container workflows
    - Any base images or shared Docker snippets that can be reused by service Dockerfiles.
- **K8s-native and Day-2 concerns baked into scaffolding**
  - In service entrypoints, structure async processing loops (especially for `vision-worker` and `agent-orchestrator`) around a shared backoff utility from `@shared/utils` (even as a stub), and import a shared logger interface to enforce consistent structured logging.
  - In Helm chart templates, include placeholders for:
    - Resource requests/limits tuned for autoscaling
    - HPA templates based on CPU/memory (with notes to refine for Vision Worker pods)
  - In `shared/types`, define early structures that attach extracted data to `(BatesNumber, BoundingBox { x, y, w, h })` so all workers are forced into auditability-first data shapes.
- **Tooling and quality gates**
  - Add a root test runner config (e.g., `[vitest.config.mts](vitest.config.mts)` or `[jest.config.mts](jest.config.mts)`) with per-package test discovery.
  - Add a linter setup:
    - `[eslint.config.mjs](eslint.config.mjs)` with TypeScript, ESM, and monorepo support
    - `[prettier.config.mjs](prettier.config.mjs)` for formatting
  - Root scripts in `[package.json](package.json)` to run checks across all workspaces: `pnpm lint`, `pnpm test`, `pnpm build`.
- **Documentation**
  - In `[README.md](README.md)`, document:
    - Monorepo layout and purpose of each directory (`packages/`, `shared/`, `infra/`)
    - How to bootstrap the repo: `pnpm install`, `pnpm build`, `pnpm test`
    - How to build Docker images for each service and a basic Helm install/upgrade loop for local clusters.
