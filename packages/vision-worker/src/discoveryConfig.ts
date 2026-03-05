import path from "node:path";

export interface DiscoveryConfig {
  readonly inboxDir: string;
  readonly processedDir: string;
  readonly errorDir: string;
}

export function loadDiscoveryConfig(): DiscoveryConfig {
  const cwd = process.cwd();

  const inboxDir =
    process.env.DISCOVERY_INBOX_DIR ?? path.join(cwd, "discovery", "inbox");

  const processedDir =
    process.env.DISCOVERY_PROCESSED_DIR ?? path.join(cwd, "discovery", "processed");

  const errorDir =
    process.env.DISCOVERY_ERROR_DIR ?? path.join(cwd, "discovery", "error");

  return {
    inboxDir,
    processedDir,
    errorDir
  };
}

