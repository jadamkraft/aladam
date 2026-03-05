import { describe, it, expect } from "vitest";

import type { BatesID } from "@asymmetric-legal/types";

import { batesIdFromFilename } from "../src/batesIdFromFilename.js";

describe("batesIdFromFilename", () => {
  it("accepts valid Bates IDs derived from filenames", () => {
    const idFromPath = batesIdFromFilename("/tmp/KRAFT-123.pdf");
    const idFromRelative = batesIdFromFilename("ABC123-0001.tif");

    expect(idFromPath).toBe("KRAFT-123");
    expect(idFromRelative).toBe("ABC123-0001");

    // Ensure the returned values are assignable to the branded BatesID type.
    const typedIdFromPath: BatesID = idFromPath;
    const typedIdFromRelative: BatesID = idFromRelative;

    expect(typedIdFromPath).toBe(idFromPath);
    expect(typedIdFromRelative).toBe(idFromRelative);
  });

  it("rejects filenames that are missing the hyphen", () => {
    expect(() => batesIdFromFilename("KRAFT123.pdf")).toThrowError(
      /Invalid BatesID derived from filename/
    );
  });

  it("rejects filenames whose suffix is not numeric", () => {
    expect(() => batesIdFromFilename("123-KRAFT.pdf")).toThrowError(
      /Invalid BatesID derived from filename/
    );
  });

  it("rejects filenames with lowercase prefixes", () => {
    expect(() => batesIdFromFilename("kraft-123.pdf")).toThrowError(
      /Invalid BatesID derived from filename/
    );
  });
});

