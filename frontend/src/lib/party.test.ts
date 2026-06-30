import { describe, expect, it } from "vitest";

import { hasKnownParty, resolveParty } from "./party";

describe("resolveParty", () => {
  it("prefers member party when known", () => {
    expect(resolveParty("Democratic", "Republican")).toBe("Democratic");
  });

  it("falls back to report party when member is unknown", () => {
    expect(resolveParty("Unknown", "Republican")).toBe("Republican");
  });

  it("returns empty string when both are blank", () => {
    expect(resolveParty("", "")).toBe("");
  });
});

describe("hasKnownParty", () => {
  it("returns true for recognized parties", () => {
    expect(hasKnownParty("Democratic")).toBe(true);
    expect(hasKnownParty("Republican Party")).toBe(true);
  });

  it("returns false for unknown parties", () => {
    expect(hasKnownParty("Unknown")).toBe(false);
    expect(hasKnownParty("")).toBe(false);
  });
});