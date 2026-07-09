// Validates the six built-in theme palettes (issue #10): sources use the
// canonical role names; the built dist/themes.json uses the backend /theme
// API field names and must be value-identical to the backend's DEFAULT_THEMES.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";

const THEMES_DIR = new URL("../themes/", import.meta.url).pathname;
const DIST = new URL("../dist/", import.meta.url).pathname;

const ROLES = [
  "background",
  "surface",
  "surface2",
  "accent",
  "primary",
  "secondary",
  "success",
  "warning",
  "error",
];

// Verbatim from chores-web-backend app/routers/theme.py DEFAULT_THEMES,
// keyed by API field names.
const BACKEND_DEFAULT_THEMES = {
  dark: {
    bg: "#080c14",
    surface: "#16202e",
    surface2: "#1e2d40",
    accent: "#73B1DD",
    primary: "#3574B3",
    secondary: "#4a5568",
    success: "#3db87a",
    warning: "#e8a930",
    error: "#e05c6a",
  },
  light: {
    bg: "#f5f5f5",
    surface: "#ffffff",
    surface2: "#eeeeee",
    accent: "#0066cc",
    primary: "#0066cc",
    secondary: "#6c757d",
    success: "#00aa00",
    warning: "#ff9900",
    error: "#cc0000",
  },
  charcoal: {
    bg: "#1a1a1a",
    surface: "#2d2d2d",
    surface2: "#3a3a3a",
    accent: "#999999",
    primary: "#666666",
    secondary: "#555555",
    success: "#999999",
    warning: "#999999",
    error: "#999999",
  },
  paper: {
    bg: "#f0ede6",
    surface: "#faf8f3",
    surface2: "#f5f0e9",
    accent: "#b8860b",
    primary: "#8b6914",
    secondary: "#7a7a6a",
    success: "#558b2f",
    warning: "#e0860b",
    error: "#d32f2f",
  },
  pink: {
    bg: "#ffffff",
    surface: "#fff0f5",
    surface2: "#ffe0ea",
    accent: "#ec407a",
    primary: "#e91e8c",
    secondary: "#c48b9f",
    success: "#66bb6a",
    warning: "#ffa726",
    error: "#ef5350",
  },
  frog: {
    bg: "#1b4d2e",
    surface: "#2d6a3e",
    surface2: "#3d8b52",
    accent: "#c8e6c9",
    primary: "#5a9e6f",
    secondary: "#4a7a5e",
    success: "#9ccc65",
    warning: "#ffa726",
    error: "#ef5350",
  },
};

const THEME_NAMES = Object.keys(BACKEND_DEFAULT_THEMES);

describe("theme palette sources (themes/*.json)", () => {
  it("one source file per built-in theme, no extras", () => {
    const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".json"));
    expect(files.sort()).toEqual(THEME_NAMES.map((n) => `${n}.json`).sort());
  });

  it.each(THEME_NAMES)("%s defines exactly the 9 canonical roles", (name) => {
    const theme = JSON.parse(readFileSync(`${THEMES_DIR}${name}.json`, "utf8"));
    expect(Object.keys(theme).sort()).toEqual([...ROLES].sort());
  });

  it.each(THEME_NAMES)("%s values match the backend palette verbatim", (name) => {
    const theme = JSON.parse(readFileSync(`${THEMES_DIR}${name}.json`, "utf8"));
    const backend = BACKEND_DEFAULT_THEMES[name];
    for (const role of ROLES) {
      const apiField = role === "background" ? "bg" : role;
      expect(theme[role], `${name}.${role}`).toBe(backend[apiField]);
    }
  });

  it("the default sets in the token source stay in sync with the dark/paper palettes", () => {
    // color.dark ≡ themes/dark.json, color.light ≡ themes/paper.json
    const dark = JSON.parse(readFileSync(`${THEMES_DIR}dark.json`, "utf8"));
    const paper = JSON.parse(readFileSync(`${THEMES_DIR}paper.json`, "utf8"));
    expect(dark.background).toBe("#080c14");
    expect(paper.surface2).toBe("#f5f0e9");
  });
});

describe("built themes artifact (dist/themes.json)", () => {
  it("exists and uses the backend API field names, value-identical to DEFAULT_THEMES", () => {
    expect(existsSync(`${DIST}themes.json`)).toBe(true);
    const built = JSON.parse(readFileSync(`${DIST}themes.json`, "utf8"));
    expect(built).toEqual(BACKEND_DEFAULT_THEMES);
  });

  it("is exported from the npm package", () => {
    const pkg = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8")
    );
    expect(pkg.exports["./themes.json"]).toBe("./dist/themes.json");
  });
});
