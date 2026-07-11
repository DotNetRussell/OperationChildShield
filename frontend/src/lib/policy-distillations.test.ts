import { describe, expect, it } from "vitest";
import { POLICY_DISTILLATIONS } from "./policy-distillations";

describe("POLICY_DISTILLATIONS", () => {
  it("has unique ids and congress.gov deep links on every bullet", () => {
    const ids = new Set<string>();
    for (const policy of POLICY_DISTILLATIONS) {
      expect(policy.id).toBeTruthy();
      expect(ids.has(policy.id)).toBe(false);
      ids.add(policy.id);
      expect(policy.overviewUrl).toContain("congress.gov");
      expect(policy.bullets.length).toBeGreaterThan(0);
      for (const bullet of policy.bullets) {
        expect(bullet.text.length).toBeGreaterThan(20);
        expect(bullet.sourceUrl).toMatch(/^https:\/\/www\.congress\.gov\//);
        expect(bullet.sourceLabel).toBeTruthy();
      }
    }
  });

  it("avoids grade/ranking language in bullet text", () => {
    const joined = POLICY_DISTILLATIONS.flatMap((p) => p.bullets.map((b) => b.text)).join(
      " "
    );
    expect(joined.toLowerCase()).not.toMatch(/\b(grade|scorecard|worst|champion)\b/);
  });
});
