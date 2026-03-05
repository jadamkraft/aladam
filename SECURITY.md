## Security and Data Handling

The Asymmetric Legal Intelligence System is designed to operate on sensitive legal and medical information in production environments. This public repository, however, must **never** contain real-world protected data or secrets.

### Protected data

Do **not** commit:

- Real patient or resident data (names, MRNs, claim IDs, addresses, dates of birth, etc.).
- Real law firm, client, or facility names connected to actual cases.
- Real Bates ranges or page identifiers from active or historical matters.
- Any other information that could reasonably identify a person, facility, or case.

Use synthetic, obviously fictitious placeholders instead, such as:

- `PATIENT_001`, `RESIDENT_ABC`, `FACILITY_XYZ`
- `CASE_0001`, `MATTER_1234`
- `BATES_000001–000010`

### Secrets and configuration

- Keep API keys, connection strings, and credentials in secure secret managers or local `.env` files, not in version control.
- Follow the patterns in `.env.example` and the Helm `values-secrets.example.yaml` / `secrets.yaml` stubs.
- The `.gitignore` file is configured to avoid committing common secret and data artefacts; do not circumvent it.

### Tooling output (e.g., Cursor plans)

- Local tools such as Cursor plans (`.cursor/plans`) must not contain real PHI or lawyer-specific Bates ranges.
- When describing scenarios in plans or docs, use synthetic identifiers and clearly label them as examples.

### Reporting issues

If you believe you have found a security issue or accidentally committed sensitive information:

- Remove or rotate the affected secret or data as appropriate.
- Open an issue or contact the maintainer with high-level details (without including the sensitive content itself).

