#!/usr/bin/env node
// Cross-repo composite visual review gallery (issue #6, rollout
// derekwinters/chores-web-docs#11): pairs web visual-regression baselines
// (chores-web-frontend .visual-baselines/) with android Roborazzi goldens
// (chores-web-android app/src/test/snapshots/) by their shared basename
// convention <component>_<variant>_<dark|paper>.png and emits ONE
// self-contained HTML file (images inlined) suitable for a CI artifact.
//
// Usage:
//   node composite-gallery.mjs --web <dir> --android <dir> --out gallery.html
//
// Both snapshot sets are committed to their repos, so client CI builds the
// gallery from its own working tree + a shallow public clone of the sibling
// repo — no tokens, no artifact APIs.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    console.error(`missing --${name} <value>`);
    process.exit(2);
  }
  return process.argv[i + 1];
}

const webDir = arg("web");
const androidDir = arg("android");
const outFile = arg("out");

const pngs = (dir) => {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  } catch {
    return [];
  }
};

const web = new Map(pngs(webDir).map((f) => [f, join(webDir, f)]));
const android = new Map(pngs(androidDir).map((f) => [f, join(androidDir, f)]));

const paired = [...web.keys()].filter((k) => android.has(k));
const webOnly = [...web.keys()].filter((k) => !android.has(k));
const androidOnly = [...android.keys()].filter((k) => !web.has(k));

const dataUri = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const cell = (path) =>
  path
    ? `<td><img src="${dataUri(path)}" alt="" loading="lazy"></td>`
    : `<td class="missing">—</td>`;

const pairedRows = paired
  .map(
    (k) => `<tr><th>${esc(k.replace(/\.png$/, ""))}</th>${cell(web.get(k))}${cell(android.get(k))}</tr>`
  )
  .join("\n");

const unmatchedRows = [
  ...webOnly.map((k) => `<tr><th>${esc(k.replace(/\.png$/, ""))}</th>${cell(web.get(k))}<td class="missing">no android golden</td></tr>`),
  ...androidOnly.map((k) => `<tr><th>${esc(k.replace(/\.png$/, ""))}</th><td class="missing">no web baseline</td>${cell(android.get(k))}</tr>`),
].join("\n");

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>chores-web composite visual gallery</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; background: #f5f5f5; color: #1a1a1a; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 2rem; background: #fff; }
  th, td { padding: 0.75rem; text-align: left; vertical-align: top; border-bottom: 1px solid #eee; }
  thead th { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
  tbody th { font-family: monospace; font-weight: 500; font-size: 0.85rem; width: 22rem; }
  img { max-width: 420px; height: auto; display: block; border: 1px solid #ddd; }
  .missing { color: #999; font-style: italic; }
  .summary { margin-bottom: 1.5rem; }
</style>
<h1>Composite visual gallery</h1>
<p class="summary"><strong>${paired.length} paired</strong> · ${webOnly.length} web-only · ${androidOnly.length} android-only</p>
<table>
  <thead><tr><th>component_variant_theme</th><th>Web (Storybook baseline)</th><th>Android (Roborazzi golden)</th></tr></thead>
  <tbody>
${pairedRows}
  </tbody>
</table>
<h2>Unmatched snapshots</h2>
<table>
  <thead><tr><th>name</th><th>Web</th><th>Android</th></tr></thead>
  <tbody>
${unmatchedRows || '<tr><td colspan="3">none — full parity</td></tr>'}
  </tbody>
</table>
</html>
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
console.log(
  `gallery: ${paired.length} paired, ${webOnly.length} web-only, ${androidOnly.length} android-only → ${outFile}`
);
