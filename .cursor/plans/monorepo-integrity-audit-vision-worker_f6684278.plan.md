---
name: monorepo-integrity-audit-vision-worker
overview: Align the monorepo TypeScript config, workspace dependencies, and imports so that the vision-worker package cleanly builds under Node 22 ESM with no red errors in the file tree.
todos:
  - id: deps-sync-vision-worker
    content: Switch vision-worker and shared/utils dependencies to use pnpm workspace:* protocol with @asymmetric-legal/* package names.
    status: completed
  - id: tsconfig-paths-alignment
    content: Update tsconfig.base.json paths to map @asymmetric-legal/types and @asymmetric-legal/utils to the shared source entrypoints and remove @shared/* aliases.
    status: completed
  - id: fix-shared-imports
    content: Update imports in vision-worker main.ts and shared/utils index.ts to use @asymmetric-legal/* package names instead of @shared/*/src/index.js.
    status: completed
  - id: build-and-verify
    content: Run pnpm build and fix any remaining TypeScript or ESM resolution errors until the monorepo builds cleanly and IDE shows zero red errors.
    status: completed
isProject: false
---

### Monorepo integrity goals

- **Zero red errors** in the TypeScript/IDE view for `vision-worker` and shared packages.
- **Consistent dependency model**: all intra-repo dependencies wired via pnpm workspace protocol and matching runtime package names.
- **Node 22 ESM correctness**: all compiled entrypoints use ESM-safe specifiers that Node 22 can resolve via normal package resolution.

### 1) Dependency sync for vision-worker and shared packages

- **Update vision-worker workspace deps**
  - In `[packages/vision-worker/package.json](packages/vision-worker/package.json)`, change the `dependencies` on the shared libraries to use pnpm workspace protocol and the existing package names:
    - `"@asymmetric-legal/types": "workspace:*"`
    - `"@asymmetric-legal/utils": "workspace:*"`
  - Confirm there are no additional direct references to `@shared/` here.
- **Align shared/utils dependency on types**
  - In `[shared/utils/package.json](shared/utils/package.json)`, switch the `"@asymmetric-legal/types"` version to `"workspace:*"` so it also participates fully in pnpm workspace resolution.
- **Workspace config sanity check**
  - Ensure `[pnpm-workspace.yaml](pnpm-workspace.yaml)` and the root `[package.json](package.json)` `workspaces` entries both cover `packages/`_ and `shared/`_ (already true, just confirm nothing needs changing).

### 2) TSConfig alignment and path aliases

- **Keep a single source of truth in the base config**
  - In `[tsconfig.base.json](tsconfig.base.json)`, update the `compilerOptions.paths` to use the runtime package names instead of the `@shared/` aliases:
    - `"@asymmetric-legal/types": ["shared/types/src/index.ts"]`
    - `"@asymmetric-legal/utils": ["shared/utils/src/index.ts"]`
  - Remove any remaining `@shared/`-style entries so there is no ambiguity.
- **Verify per-package configs extend correctly**
  - Confirm `[packages/vision-worker/tsconfig.json](packages/vision-worker/tsconfig.json)` already extends `../../tsconfig.base.json` (it does) and keep only package-specific overrides (`rootDir: "src"`, `outDir: "dist"`).
  - Likewise, keep `[shared/types/tsconfig.json](shared/types/tsconfig.json)` and `[shared/utils/tsconfig.json](shared/utils/tsconfig.json)` extending the same base config so that any future shared aliases or compiler flags stay consistent.
- **ESM and Node 22 rules check**
  - Ensure we keep `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"type": "module"` in each package so that built JS matches Node 22 ESM expectations.

### 3) Fix imports and type resolution

- **Vision worker entrypoint imports**
  - In `[packages/vision-worker/src/main.ts](packages/vision-worker/src/main.ts)`, replace the current imports:
    - From `"@shared/utils/src/index.js"` → `"@asymmetric-legal/utils"`.
    - From `"@shared/types/src/index.js"` → `"@asymmetric-legal/types"`.
  - This ensures both the TypeScript compiler and Node 22 resolve via the workspace-linked packages and their `exports` fields, instead of reaching into `src` with `.js` extensions.
- **Shared utils dependency on types**
  - In `[shared/utils/src/index.ts](shared/utils/src/index.ts)`, update the `import type { ... } from "@shared/types/src/index.js";` to import from `"@asymmetric-legal/types"` instead.
  - This removes the last remaining `@shared/` reference in actual code while still allowing direct type-sharing across packages.
- **Search for stragglers**
  - Run a search for `"@shared/"` across the repo (excluding `.cursor` plan files) and confirm there are no remaining imports or config references outside of historical plan documents.

### 4) Build and typecheck verification

- **Install and build under Node 22**
  - From the repo root, run `pnpm install` to wire workspace links if not already installed.
  - Then run `pnpm build` (which calls `pnpm -r --filter ./packages... --filter ./shared... run build`) and ensure:
    - `shared/types`, `shared/utils`, and `packages/vision-worker` all compile cleanly with `tsc -p tsconfig.json`.
- **Resolve any remaining TypeScript issues**
  - If the build surfaces any `Cannot find module` or `Cannot find name` errors, use the compiler output to trace back remaining bad specifiers or missing type exports and adjust imports or re-exports accordingly (staying consistent with the `@asymmetric-legal/` naming).
- **IDE / language-server sanity check**
  - Open `main.ts` and the shared `index.ts` files in the editor and verify there are no red squiggles for unresolved modules or types.
  - Confirm that the TypeScript language service correctly jumps from `@asymmetric-legal/utils` and `@asymmetric-legal/types` imports in `vision-worker` to the implementations in `shared/utils` and `shared/types`.

### 5) Final Node 22 ESM runtime check (optional but recommended)

- **Local runtime smoke test**
  - After a successful build, run `pnpm --filter @asymmetric-legal/vision-worker start` (or equivalent) to confirm Node can resolve `@asymmetric-legal/utils` and `@asymmetric-legal/types` at runtime with no ESM resolution errors.
  - Watch for any `ERR_MODULE_NOT_FOUND` or ESM import-related issues; if any appear, double-check that the built `dist` code only uses `@asymmetric-legal/` specifiers and that pnpm has linked those workspace packages correctly.
