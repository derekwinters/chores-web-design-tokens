// Validates the BUILT platform outputs (issue #3 acceptance):
// the same token source must produce valid web CSS/JS and valid Kotlin.
// `npm test` runs the build first, so dist/ is expected to exist here.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const DIST = new URL("../dist/", import.meta.url).pathname;

function read(rel) {
  const p = DIST + rel;
  expect(existsSync(p), `${rel} must be produced by the build`).toBe(true);
  return readFileSync(p, "utf8");
}

describe("web CSS output (dist/web/tokens.css)", () => {
  it("emits the runtime-compatible slot names the frontend's applyTheme() writes", () => {
    const css = read("web/tokens.css");
    // dark set is the :root prepaint (decision in chores-web-frontend#22)
    expect(css).toMatch(/--bg:\s*#080c14/);
    expect(css).toMatch(/--surface:\s*#16202e/);
    expect(css).toMatch(/--surface2:\s*#1e2d40/);
    expect(css).toMatch(/--accent:\s*#73B1DD/i);
    expect(css).toMatch(/--primary:\s*#3574B3/i);
    expect(css).toMatch(/--secondary:\s*#4a5568/);
    expect(css).toMatch(/--success:\s*#3db87a/);
    expect(css).toMatch(/--warning:\s*#e8a930/);
    expect(css).toMatch(/--error:\s*#e05c6a/);
    expect(css).toMatch(/--text:\s*#dce8f5/);
    expect(css).toMatch(/--text-muted:\s*#7899b8/);
    expect(css).toMatch(/--on-primary:\s*#ffffff/);
    expect(css).toMatch(/--overlay:\s*rgba\(0, 0, 0, 0\.6\)/);
    expect(css).toMatch(/--points:\s*#c9a84c/);
  });

  it("emits the -rgb triplets used for tint patterns", () => {
    const css = read("web/tokens.css");
    expect(css).toMatch(/--accent-rgb:\s*115, 177, 221/);
    expect(css).toMatch(/--error-rgb:\s*224, 92, 106/);
    expect(css).toMatch(/--warning-rgb:\s*232, 169, 48/);
    expect(css).toMatch(/--success-rgb:\s*61, 184, 122/);
    expect(css).toMatch(/--points-rgb:\s*201, 168, 76/);
  });

  it("DECISION: no --border color custom property", () => {
    const css = read("web/tokens.css");
    expect(css).not.toMatch(/--border:\s*#/);
  });

  it("emits scale tokens (spacing, radius, sizes, motion, z-index, elevation)", () => {
    const css = read("web/tokens.css");
    expect(css).toMatch(/--space-lg:\s*16px/);
    expect(css).toMatch(/--space-xl:\s*24px/);
    expect(css).toMatch(/--radius-md:\s*12px/);
    expect(css).toMatch(/--radius-pill:\s*9999px/);
    expect(css).toMatch(/--size-topbar:\s*64px/);
    expect(css).toMatch(/--size-form-max:\s*400px/);
    expect(css).toMatch(/--duration-lg:\s*300ms/);
    expect(css).toMatch(/--z-modal:\s*400/);
    expect(css).toMatch(/--elevation-0:\s*none/);
    expect(css).toMatch(/--elevation-3:.*rgba\(0, 0, 0/);
    expect(css).toMatch(/--alpha-tint:\s*0\.15/);
  });
});

describe("web JS output (dist/web/tokens.js)", () => {
  it("exports both color sets and the scales as a typed module", async () => {
    read("web/tokens.js"); // existence check
    const mod = await import(DIST + "web/tokens.js");
    expect(mod.color.dark.background).toBe("#080c14");
    expect(mod.color.dark.surface2).toBe("#1e2d40");
    expect(mod.color.light.background).toBe("#f0ede6");
    expect(mod.color.light.surface2).toBe("#f5f0e9");
    expect(mod.color.light.points).toBe("#c9a84c");
    expect(mod.color.dark.border).toBeUndefined();
    expect(mod.space.lg).toBe(16);
    expect(mod.size.topbar).toBe(64);
    expect(mod.radius.md).toBe(12);
    expect(mod.duration.lg).toBe(300);
    expect(mod.alpha.tint).toBe(0.15);
    expect(mod.elevation["3"].web).toMatch(/rgba/);
    expect(mod.typography["brand-title"]["letter-spacing"]).toBe(-0.5);
  });
});

describe("android Kotlin output (dist/android/DesignTokens.kt)", () => {
  it("is a plausible Kotlin file with package + balanced braces", () => {
    const kt = read("android/DesignTokens.kt");
    expect(kt).toMatch(/^package com\.derekwinters\.chores\.tokens/m);
    const open = (kt.match(/\{/g) || []).length;
    const close = (kt.match(/\}/g) || []).length;
    expect(open).toBe(close);
    expect(open).toBeGreaterThan(3);
  });

  it("carries the color sets as ARGB longs (dark + light, points, no border)", () => {
    const kt = read("android/DesignTokens.kt");
    expect(kt).toMatch(/0xFF080C14/);
    expect(kt).toMatch(/0xFF1E2D40/); // dark surface2
    expect(kt).toMatch(/0xFFF0EDE6/); // light background
    expect(kt).toMatch(/0xFFC9A84C/); // points
    expect(kt).not.toMatch(/BORDER/);
  });

  it("carries the dp/sp scales and decisions", () => {
    const kt = read("android/DesignTokens.kt");
    expect(kt).toMatch(/LG\s*=\s*16/); // space
    expect(kt).toMatch(/TOPBAR\s*=\s*64/);
    expect(kt).toMatch(/SCALE_IN_START\s*=\s*0\.92f/);
    expect(kt).toMatch(/DURATION_LG\s*=\s*300/);
    expect(kt).toMatch(/ELEVATION_2\s*=\s*8/);
    expect(kt).toMatch(/BRAND_TITLE_SIZE\s*=\s*20\.8f/);
  });
});
