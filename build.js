import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import StyleDictionary from "style-dictionary";
import config from "./style-dictionary.config.js";

// Tier-1 tokens → per-platform outputs (dist/web, dist/android)
const sd = new StyleDictionary(config);
await sd.buildAllPlatforms();

// Built-in theme palettes → dist/themes.json, keyed by the backend /theme
// API field names (token role `background` ↔ API field `bg`) so the backend
// can load it without a translation layer (issue #10).
const THEME_ORDER = ["dark", "light", "charcoal", "paper", "pink", "frog"];
const themes = {};
const available = new Set(readdirSync("themes").filter((f) => f.endsWith(".json")));
for (const name of THEME_ORDER) {
  if (!available.has(`${name}.json`)) continue;
  const roles = JSON.parse(readFileSync(`themes/${name}.json`, "utf8"));
  const { background, ...rest } = roles;
  themes[name] = { bg: background, ...rest };
}
// Any additional custom theme files ride along after the built-ins.
for (const file of [...available].sort()) {
  const name = file.replace(/\.json$/, "");
  if (themes[name]) continue;
  const { background, ...rest } = JSON.parse(readFileSync(`themes/${file}`, "utf8"));
  themes[name] = { bg: background, ...rest };
}
mkdirSync("dist", { recursive: true });
writeFileSync("dist/themes.json", JSON.stringify(themes, null, 2) + "\n");

console.log("✔ design tokens built (web + android + themes.json)");
