// Component-tier tokens (issue #11): third tier of the alias chain.
// Component tokens ALIAS foundation tokens; raw values are allowed only for
// the matrix-documented exceptions (pill-badge 10, inner-with-bar/modal 20,
// form-field 10, elevation level indices).
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const TOKENS_DIR = new URL("../tokens/", import.meta.url).pathname;
const COMPONENT_DIR = join(TOKENS_DIR, "component");

function mergeDeep(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      target[k] ??= {};
      mergeDeep(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}
function allTokenFiles(dir = TOKENS_DIR, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) allTokenFiles(p, acc);
    else if (entry.name.endsWith(".json")) acc.push(p);
  }
  return acc;
}
function tree() {
  const t = {};
  for (const f of allTokenFiles()) mergeDeep(t, JSON.parse(readFileSync(f, "utf8")));
  return t;
}
function node(t, path) {
  return path.split(".").reduce((acc, k) => acc?.[k], t);
}
function resolve(t, raw) {
  if (typeof raw !== "string") return raw;
  const m = raw.match(/^\{([^}]+)\}$/);
  if (!m) return raw;
  const target = node(t, m[1]);
  expect(target?.$value, `alias {${m[1]}} must resolve`).toBeDefined();
  return resolve(t, target.$value);
}
const val = (t, path) => {
  const n = node(t, path);
  expect(n?.$value, `component token ${path} must exist`).toBeDefined();
  return resolve(t, n.$value);
};

describe("component token sources", () => {
  const t = tree();

  it("live under tokens/component/", () => {
    expect(existsSync(COMPONENT_DIR)).toBe(true);
    expect(readdirSync(COMPONENT_DIR).length).toBeGreaterThanOrEqual(8);
  });

  it("button: pill radius, 8×16 padding, alpha states, icon-action size", () => {
    expect(val(t, "component.button.radius")).toBe(9999);
    expect(val(t, "component.button.padding-y")).toBe(8);
    expect(val(t, "component.button.padding-x")).toBe(16);
    expect(val(t, "component.button.disabled-alpha")).toBe(0.4);
    expect(val(t, "component.button.hover-alpha")).toBe(0.85);
    expect(val(t, "component.button.icon-action-size")).toBe(16);
  });

  it("chore-row: 16×8 outer, 16 inner (20 with bar), 4px accent bar, xs action gap", () => {
    expect(val(t, "component.chore-row.padding-outer-x")).toBe(16);
    expect(val(t, "component.chore-row.padding-outer-y")).toBe(8);
    expect(val(t, "component.chore-row.padding-inner")).toBe(16);
    expect(val(t, "component.chore-row.padding-inner-with-bar")).toBe(20);
    expect(val(t, "component.chore-row.accent-bar-width")).toBe(4);
    expect(val(t, "component.chore-row.action-gap")).toBe(4);
  });

  it("pill-badge: pill radius, 10×4 padding, 0.15 tint fill", () => {
    expect(val(t, "component.pill-badge.radius")).toBe(9999);
    expect(val(t, "component.pill-badge.padding-x")).toBe(10);
    expect(val(t, "component.pill-badge.padding-y")).toBe(4);
    expect(val(t, "component.pill-badge.fill-alpha")).toBe(0.15);
  });

  it("card: radius 12, flat by default, stat=2 selected=3 elevation levels", () => {
    expect(val(t, "component.card.radius")).toBe(12);
    expect(val(t, "component.card.elevation-resting")).toBe(0);
    expect(val(t, "component.card.elevation-stat")).toBe(2);
    expect(val(t, "component.card.elevation-selected")).toBe(3);
  });

  it("nav + top-bar: sidebar sizes, item radius/padding, DECIDED height 64, avatar 32", () => {
    expect(val(t, "component.nav.sidebar-width")).toBe(240);
    expect(val(t, "component.nav.sidebar-collapsed-width")).toBe(80);
    expect(val(t, "component.nav.item-radius")).toBe(8);
    expect(val(t, "component.nav.item-padding")).toBe(12);
    expect(val(t, "component.top-bar.height")).toBe(64);
    expect(val(t, "component.top-bar.avatar-size")).toBe(32);
  });

  it("modal + form-field + toast", () => {
    expect(val(t, "component.modal.max-width")).toBe(540);
    expect(val(t, "component.modal.radius")).toBe(12);
    expect(val(t, "component.modal.padding")).toBe(20);
    expect(val(t, "component.form-field.radius")).toBe(4);
    expect(val(t, "component.form-field.padding-y")).toBe(10);
    expect(val(t, "component.form-field.padding-x")).toBe(12);
    expect(val(t, "component.form-field.focus-ring-width")).toBe(3);
    expect(val(t, "component.form-field.focus-ring-alpha")).toBe(0.1);
    expect(val(t, "component.toast.radius")).toBe(12);
    expect(val(t, "component.toast.duration")).toBe(200);
    expect(val(t, "component.toast.elevation")).toBe(3);
  });

  it("alias-only rule: raw values appear only on the documented exception list", () => {
    const RAW_ALLOWED = new Set([
      "component.chore-row.padding-inner-with-bar", // 20 — matrix-documented
      "component.pill-badge.padding-x", // 10 — android PillBadge
      "component.modal.padding", // 20 — matrix-documented
      "component.form-field.padding-y", // 10 — matrix-documented
      "component.card.elevation-resting", // level indices into elevation.*
      "component.card.elevation-stat",
      "component.card.elevation-selected",
      "component.toast.elevation",
    ]);
    const walk = (n, path) => {
      if (!n || typeof n !== "object") return;
      if ("$value" in n) {
        const isAlias = typeof n.$value === "string" && /^\{[^}]+\}$/.test(n.$value);
        if (!isAlias) {
          expect(RAW_ALLOWED.has(path.join(".")), `${path.join(".")} must alias a foundation token`).toBe(true);
        }
        return;
      }
      for (const [k, v] of Object.entries(n)) walk(v, [...path, k]);
    };
    walk(node(t, "component"), ["component"]);
  });
});

describe("component tokens in built outputs", () => {
  const DIST = new URL("../dist/", import.meta.url).pathname;

  it("web CSS emits --component-* custom properties", () => {
    const css = readFileSync(DIST + "web/tokens.css", "utf8");
    expect(css).toMatch(/--component-button-radius:\s*9999px/);
    expect(css).toMatch(/--component-top-bar-height:\s*64px/);
    expect(css).toMatch(/--component-pill-badge-fill-alpha:\s*0\.15/);
    expect(css).toMatch(/--component-chore-row-accent-bar-width:\s*4px/);
  });

  it("web JS exports the component tree resolved", async () => {
    const mod = await import(DIST + "web/tokens.js");
    expect(mod.component.button["padding-x"]).toBe(16);
    expect(mod.component["top-bar"].height).toBe(64);
  });

  it("Kotlin output carries component constants", () => {
    const kt = readFileSync(DIST + "android/DesignTokens.kt", "utf8");
    expect(kt).toMatch(/object Component \{/);
    expect(kt).toMatch(/CHORE_ROW_PADDING_INNER_WITH_BAR = 20/);
    expect(kt).toMatch(/PILL_BADGE_PADDING_X = 10/);
    expect(kt).toMatch(/TOP_BAR_HEIGHT = 64/);
    expect(kt).toMatch(/CARD_ELEVATION_SELECTED = 3/);
  });
});
