import path from "node:path";

import type { BatesID } from "@asymmetric-legal/types";

// Strict BatesID format: PREFIX-DIGITS (e.g., ABC123-0001)
const BATES_ID_REGEX = /^[A-Z0-9]+-[0-9]+$/;

export function batesIdFromFilename(filePath: string): BatesID {
  const baseName = path.basename(filePath);

  const withoutExtension = baseName.replace(/\.[^./]+$/, "");

  if (!BATES_ID_REGEX.test(withoutExtension)) {
    throw new Error(
      `Invalid BatesID derived from filename: "${baseName}". Expected format ${BATES_ID_REGEX.source}`
    );
  }

  return withoutExtension as BatesID;
}

