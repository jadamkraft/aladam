## Contributing

Thanks for your interest in the Asymmetric Legal Intelligence System. This project is currently focused on establishing a solid technical and safety foundation for automated, agentic medical/legal reconciliation.

### Getting started

- Use Node.js `>=22` and `pnpm` (via `corepack`).
- From the repo root:
  - `pnpm install`
  - `pnpm build`
  - `pnpm test`

All pull requests should pass `pnpm build` and `pnpm test` locally before opening.

### Coding standards

- TypeScript only, strict mode with **no `any`**.
- Prefer small, composable modules with explicit types.
- Keep imports aligned with the workspace package names (e.g. `@asymmetric-legal/types`, `@asymmetric-legal/utils`).

### Data and security guidelines

This repository is public and must **never** contain real PHI or client-identifying information.

- Do **not** add real patient names, MRNs, claim IDs, dates of birth, or similar identifiers.
- Do **not** add real law firm/client names, docket numbers, or actual Bates ranges.
- Use clearly synthetic placeholders such as:
  - `PATIENT_001`, `FACILITY_ABC`, `CASE_0001`
  - `BATES_000001–000010`
- Ensure any sample data, fixtures, and documentation examples are obviously fictitious.
- Keep secrets (API keys, connection strings, etc.) in local `.env` files or secret stores only—never in the repo.

Cursor and other local tooling (e.g. `.cursor/plans`) should also follow these rules; plans should reference only synthetic, non-identifying examples.

### CI expectations

- The GitHub Actions workflow runs `pnpm install` and `pnpm build` on every push and pull request.
- PRs should be green in CI before merge.

### License

By contributing, you agree that your contributions will be licensed under the MIT License included in this repository.

