import { describe, expect, it } from "vitest";

import { reportCardQueue } from "./fetch-queue";

describe("reportCardQueue", () => {
  it("limits concurrent task execution to three", async () => {
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 40));
      active -= 1;
      return true;
    };

    await Promise.all(
      Array.from({ length: 6 }, () => reportCardQueue.enqueue(task))
    );

    expect(maxActive).toBeLessThanOrEqual(3);
    expect(active).toBe(0);
  });

  it("returns task results in order of completion", async () => {
    const result = await reportCardQueue.enqueue(async () => 42);
    expect(result).toBe(42);
  });

  it("propagates task errors", async () => {
    await expect(
      reportCardQueue.enqueue(async () => {
        throw new Error("queue failure");
      })
    ).rejects.toThrow("queue failure");
  });
});