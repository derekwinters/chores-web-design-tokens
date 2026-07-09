// Validates the token SOURCE files against the foundation-value spec (issue #9)
// and the recorded design decisions. These tests are the review checklist for #9.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TOKENS_DIR = new URL("../tokens/", import.meta.url).pathname;

function loadJson(rel) {
  return JSON.parse(readFileSync(join(TOKENS_DIR, rel), "utf8"));
}

// Resolve a DTCG token node ({ $value }) from a dot path within a tree.
function node(tree, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], tree);
}
function value(tree, path) {
  const n = node(tree, path);
  expect(n, `token ${path} must exist`).toBeDefined();
  expect(n.$value, `token ${path} must have $value`).toBeDefined();
  return n.$value;
}

const SLOTS = [
  "background",
  "surface",
  "surface2",
  "primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "error",
];

const DARK = {
  background: "#080c14",
  surface: "#16202e",
  surface2: "#1e2d40",
  primary: "#3574B3",
  secondary: "#4a5568",
  accent: "#73B1DD",
  success: "#3db87a",
  warning: "#e8a930",
  error: "#e05c6a",
};

const LIGHT = {
  background: "#f0ede6",
  surface: "#faf8f3",
  surface2: "#f5f0e9",
  primary: "#8b6914",
  secondary: "#7a7a6a",
  accent: "#b8860b",
  success: "#558b2f",
  warning: "#e0860b",
  error: "#d32f2f",
};

// Resolve {a.b.c} aliases against a merged tree of all token files.
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

function mergedTree() {
  const tree = {};
  for (const f of allTokenFiles()) {
    mergeDeep(tree, JSON.parse(readFileSync(f, "utf8")));
  }
  return tree;
}

function resolveValue(tree, raw, seen = new Set()) {
  if (typeof raw !== "string") return raw;
  const m = raw.match(/^\{([^}]+)\}$/);
  if (!m) return raw;
  const ref = m[1];
  expect(seen.has(ref), `alias cycle at {${ref}}`).toBe(false);
  seen.add(ref);
  const target = node(tree, ref);
  expect(target?.$value, `alias {${ref}} must resolve to a token`).toBeDefined();
  return resolveValue(tree, target.$value, seen);
}

describe("semantic color sets (dark + light)", () => {
  const tree = mergedTree();

  it("dark set defines all 9 runtime slots with the backend 'dark' palette values", () => {
    for (const slot of SLOTS) {
      const v = resolveValue(tree, value(tree, `color.dark.${slot}`));
      expect(v.toLowerCase()).toBe(DARK[slot].toLowerCase());
    }
  });

  it("light set defines all 9 runtime slots with the backend 'paper' palette values", () => {
    for (const slot of SLOTS) {
      const v = resolveValue(tree, value(tree, `color.light.${slot}`));
      expect(v.toLowerCase()).toBe(LIGHT[slot].toLowerCase());
    }
  });

  it("derived roles: text / text-muted / on-primary / overlay / points / brand", () => {
    expect(resolveValue(tree, value(tree, "color.dark.text"))).toBe("#dce8f5");
    expect(resolveValue(tree, value(tree, "color.light.text"))).toBe("#1a1a1a");
    expect(resolveValue(tree, value(tree, "color.dark.text-muted"))).toBe("#7899b8");
    expect(resolveValue(tree, value(tree, "color.light.text-muted"))).toBe("#555555");
    expect(resolveValue(tree, value(tree, "color.dark.on-primary"))).toBe("#ffffff");
    expect(resolveValue(tree, value(tree, "color.dark.overlay"))).toBe("rgba(0, 0, 0, 0.6)");
    expect(resolveValue(tree, value(tree, "color.brand"))).toBe("#1D6B4A");
  });

  it("DECISION: points/gold is the same value in both sets", () => {
    const dark = resolveValue(tree, value(tree, "color.dark.points"));
    const light = resolveValue(tree, value(tree, "color.light.points"));
    expect(dark.toLowerCase()).toBe("#c9a84c");
    expect(light.toLowerCase()).toBe(dark.toLowerCase());
  });

  it("DECISION: there is no border color token (borderless flat-surface design)", () => {
    expect(node(tree, "color.dark.border")).toBeUndefined();
    expect(node(tree, "color.light.border")).toBeUndefined();
    expect(node(tree, "color.border")).toBeUndefined();
  });

  it("every alias reference in the tree resolves", () => {
    const walk = (n) => {
      if (!n || typeof n !== "object") return;
      if ("$value" in n) {
        resolveValue(tree, n.$value);
        return;
      }
      Object.values(n).forEach(walk);
    };
    walk(tree);
  });
});

describe("alpha tokens", () => {
  const tree = mergedTree();
  it.each([
    ["tint", 0.15],
    ["tint-subtle", 0.1],
    ["muted", 0.7],
    ["disabled", 0.4],
    ["hover", 0.85],
  ])("alpha.%s = %s", (name, expected) => {
    expect(value(tree, `alpha.${name}`)).toBe(expected);
  });
});

describe("spacing scale (Android-derived: 4/8/12/16/24 core)", () => {
  const tree = mergedTree();
  it.each([
    ["none", 0],
    ["2xs", 2],
    ["xs", 4],
    ["sm", 8],
    ["md", 12],
    ["lg", 16],
    ["xl", 24],
    ["2xl", 32],
    ["3xl", 40],
    ["4xl", 48],
    ["5xl", 64],
  ])("space.%s = %s", (name, expected) => {
    expect(value(tree, `space.${name}`)).toBe(expected);
  });
});

describe("shape", () => {
  const tree = mergedTree();
  it("radius scale is exactly xs/sm/md/pill/circle", () => {
    expect(value(tree, "radius.xs")).toBe(4);
    expect(value(tree, "radius.sm")).toBe(8);
    expect(value(tree, "radius.md")).toBe(12);
    expect(value(tree, "radius.pill")).toBe(9999);
    expect(value(tree, "radius.circle")).toBe("50%");
    expect(Object.keys(node(tree, "radius")).sort()).toEqual(
      ["circle", "md", "pill", "sm", "xs"].sort()
    );
  });

  it("border widths: emphasis=2, accent-bar=4, focus-ring=3 — and no 'default' (borderless decision)", () => {
    expect(value(tree, "border.emphasis")).toBe(2);
    expect(value(tree, "border.accent-bar")).toBe(4);
    expect(value(tree, "border.focus-ring")).toBe(3);
    expect(node(tree, "border.default")).toBeUndefined();
  });
});

describe("elevation (Android dp scale, M3-derived web shadows)", () => {
  const tree = mergedTree();
  it("android dp levels are 0/4/8/12/16", () => {
    expect(value(tree, "elevation.0.android")).toBe(0);
    expect(value(tree, "elevation.1.android")).toBe(4);
    expect(value(tree, "elevation.2.android")).toBe(8);
    expect(value(tree, "elevation.3.android")).toBe(12);
    expect(value(tree, "elevation.4.android")).toBe(16);
  });
  it("web box-shadows exist for levels 1-4 (M3-derived) and level 0 is none", () => {
    expect(value(tree, "elevation.0.web")).toBe("none");
    for (const lvl of [1, 2, 3, 4]) {
      const shadow = value(tree, `elevation.${lvl}.web`);
      expect(shadow).toMatch(/rgba\(0, 0, 0/);
      expect(shadow).toMatch(/px/);
    }
  });
});

describe("motion", () => {
  const tree = mergedTree();
  it.each([
    ["xs", 100],
    ["sm", 150],
    ["md", 200],
    ["lg", 300],
    ["spinner", 1000],
  ])("duration.%s = %sms", (name, ms) => {
    expect(value(tree, `duration.${name}`)).toBe(ms);
  });
  it("fade-through initial scale is 0.92", () => {
    expect(value(tree, "motion.scale-in-start")).toBe(0.92);
  });
});

describe("layout & sizes", () => {
  const tree = mergedTree();
  it("breakpoints 600/768/1024/1200", () => {
    expect(value(tree, "breakpoint.sm")).toBe(600);
    expect(value(tree, "breakpoint.md")).toBe(768);
    expect(value(tree, "breakpoint.lg")).toBe(1024);
    expect(value(tree, "breakpoint.xl")).toBe(1200);
  });
  it("DECISION: top bar height is 64 (M3 TopAppBar default)", () => {
    expect(value(tree, "size.topbar")).toBe(64);
  });
  it("form max width is 400 (Android wins)", () => {
    expect(value(tree, "size.form-max")).toBe(400);
  });
  it("remaining sizes", () => {
    expect(value(tree, "size.content-max")).toBe(1600);
    expect(value(tree, "size.modal-max")).toBe(540);
    expect(value(tree, "size.sidebar")).toBe(240);
    expect(value(tree, "size.sidebar-collapsed")).toBe(80);
    expect(value(tree, "size.touch-target-min")).toBe(44);
  });
  it("icons 16/24/40 and avatars 32/40/128", () => {
    expect(value(tree, "icon.sm")).toBe(16);
    expect(value(tree, "icon.md")).toBe(24);
    expect(value(tree, "icon.lg")).toBe(40);
    expect(value(tree, "avatar.md")).toBe(32);
    expect(value(tree, "avatar.lg")).toBe(40);
    expect(value(tree, "avatar.hero")).toBe(128);
  });
  it("z-index scale content/nav/drawer/overlay/modal/toast", () => {
    expect(value(tree, "z.content")).toBe(0);
    expect(value(tree, "z.nav")).toBe(100);
    expect(value(tree, "z.drawer")).toBe(200);
    expect(value(tree, "z.overlay")).toBe(300);
    expect(value(tree, "z.modal")).toBe(400);
    expect(value(tree, "z.toast")).toBe(500);
  });
});

describe("typography (M3 default scale + brand)", () => {
  const tree = mergedTree();
  it.each([
    ["body-small", 12, 16, 400],
    ["body-medium", 14, 20, 400],
    ["body-large", 16, 24, 400],
    ["title-small", 14, 20, 500],
    ["title-medium", 16, 24, 500],
    ["label-small", 11, 16, 500],
    ["label-medium", 12, 16, 500],
    ["label-large", 14, 20, 500],
    ["headline-small", 24, 32, 400],
    ["headline-medium", 28, 36, 400],
    ["display-small", 36, 44, 400],
  ])("typography.%s = %s/%s weight %s", (role, size, line, weight) => {
    expect(resolveValue(tree, value(tree, `typography.${role}.size`))).toBe(size);
    expect(resolveValue(tree, value(tree, `typography.${role}.line-height`))).toBe(line);
    expect(resolveValue(tree, value(tree, `typography.${role}.weight`))).toBe(weight);
  });

  it("brand title: serif bold 20.8 with -0.5 tracking", () => {
    expect(value(tree, "typography.brand-title.size")).toBe(20.8);
    expect(resolveValue(tree, value(tree, "typography.brand-title.weight"))).toBe(700);
    expect(value(tree, "typography.brand-title.letter-spacing")).toBe(-0.5);
  });

  it("DECISION: web body font stays DM Sans; brand is serif on both platforms", () => {
    expect(value(tree, "font.family.body.web")).toContain("DM Sans");
    expect(value(tree, "font.family.brand.web")).toContain("Playfair Display");
    expect(value(tree, "font.family.brand.android")).toBe("serif");
  });

  it("font weights 400/500/600/700", () => {
    expect(value(tree, "font.weight.regular")).toBe(400);
    expect(value(tree, "font.weight.medium")).toBe(500);
    expect(value(tree, "font.weight.semibold")).toBe(600);
    expect(value(tree, "font.weight.bold")).toBe(700);
  });
});
