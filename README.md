# Asymmetric Legal Intelligence System Monorepo

This repository is a K8s-native monorepo for the **Asymmetric Legal Intelligence System** focused on nursing home negligence cases. It is built on **Node.js 22 (ESM)** and **TypeScript (strict, zero-`any`)**, with infrastructure targeting Kubernetes via Helm and Docker.

## Layout

- `packages/` – Microservices
  - `vision-worker/` – Vision worker pods optimized for HPA
  - `agent-orchestrator/` – Orchestrates multi-agent workflows
  - `data-api/` – API layer for case data access
- `shared/` – Shared libraries
  - `types/` – Domain types (e.g., branded IDs, Bates mappings)
  - `utils/` – Cross-cutting utilities (logging, backoff)
- `infra/` – Deployment artefacts
  - `helm/charts/` – Helm charts per service
  - `docker/` – Shared Docker/deployment helpers

## Node, TypeScript, and Workspaces

- Node.js: `>=22` (ESM only)
- Package manager: **pnpm** with workspaces
- TypeScript: strict configuration shared via `tsconfig.base.json`

Install dependencies:

```bash
corepack enable
pnpm install
```

Build all packages:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

## Secrets and Sensitive Configuration

This system handles sensitive legal and medical data. Secrets must never be committed.

- Use `.env.example` at the repo root as a template.
- Create a local `.env` file for development and keep it untracked (see `.gitignore`).
- Helm charts include `values-secrets.example.yaml` and `secrets.yaml` stubs; copy and fill them **outside of version control** for real deployments.

## Kubernetes and Helm

- Each service has its own Helm chart under `infra/helm/charts/<service-name>/`.
- Charts are structured for:
  - Deployments and Services
  - Future HPAs tuned for vision workloads
  - Configuration and secret wiring for Supabase and Azure resources

## Auditability and Data Model

All data extraction MUST map to `(BatesNumber, BoundingBox { x, y, w, h })`. Shared types in `shared/types` encode this requirement so that workers and APIs are forced into auditability-first, strongly typed data shapes.
