import { describe, expect, it } from "vitest";

import { getStateCode, getStateMapImageUrl, US_STATE_OPTIONS } from "./states";

describe("getStateCode", () => {
  it("prefers explicit state code", () => {
    expect(getStateCode("California", "ca")).toBe("CA");
  });

  it("maps full state names", () => {
    expect(getStateCode("New York")).toBe("NY");
    expect(getStateCode("District of Columbia")).toBe("DC");
  });

  it("falls back to first two letters", () => {
    expect(getStateCode("Unknownland")).toBe("UN");
  });
});

describe("getStateMapImageUrl", () => {
  it("returns local map path for supported states", () => {
    expect(getStateMapImageUrl("Texas", "TX")).toBe("/states/tx.png");
  });

  it("returns null for unsupported territories", () => {
    expect(getStateMapImageUrl("Guam", "GU")).toBeNull();
  });
});

describe("US_STATE_OPTIONS", () => {
  it("includes all 50 states plus DC", () => {
    const codes = new Set(US_STATE_OPTIONS.map((s) => s.code));
    expect(codes.has("CA")).toBe(true);
    expect(codes.has("DC")).toBe(true);
    expect(US_STATE_OPTIONS.length).toBeGreaterThanOrEqual(51);
  });
});