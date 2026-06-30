import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY, applyTheme, getPreferredTheme } from "./theme";

describe("getPreferredTheme", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      matchMedia: (query: string) => ({
        matches: query.includes("dark"),
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns stored theme when valid", () => {
    storage.set(THEME_STORAGE_KEY, "dark");
    expect(getPreferredTheme()).toBe("dark");
  });

  it("falls back to system preference when unset", () => {
    expect(getPreferredTheme()).toBe("dark");
  });

  it("defaults to light without window", () => {
    vi.stubGlobal("window", undefined);
    expect(getPreferredTheme()).toBe("light");
  });
});

describe("applyTheme", () => {
  it("toggles the dark class on the document root", () => {
    const classes = new Set<string>();
    const root = {
      classList: {
        toggle: (name: string, force?: boolean) => {
          if (force === true) classes.add(name);
          else if (force === false) classes.delete(name);
          else if (classes.has(name)) classes.delete(name);
          else classes.add(name);
        },
        contains: (name: string) => classes.has(name),
      },
    };
    vi.stubGlobal("document", { documentElement: root });

    applyTheme("dark");
    expect(root.classList.contains("dark")).toBe(true);

    applyTheme("light");
    expect(root.classList.contains("dark")).toBe(false);

    vi.unstubAllGlobals();
  });
});