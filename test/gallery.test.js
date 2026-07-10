// Cross-repo composite gallery (issue #6): pairs web visual-regression
// baselines with android Roborazzi goldens by shared basename
// <component>_<variant>_<dark|paper>.png and renders one self-contained HTML.
import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const SCRIPT = new URL("../scripts/composite-gallery.mjs", import.meta.url).pathname;

// 1x1 red PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64"
);

describe("composite gallery script", () => {
  let dir, webDir, androidDir, outFile;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "gallery-"));
    webDir = join(dir, "web");
    androidDir = join(dir, "android");
    outFile = join(dir, "gallery.html");
    mkdirSync(webDir);
    mkdirSync(androidDir);
    // paired on both platforms
    writeFileSync(join(webDir, "pillbadge_variants_dark.png"), PNG);
    writeFileSync(join(androidDir, "pillbadge_variants_dark.png"), PNG);
    writeFileSync(join(webDir, "buttons_primarysecondary_paper.png"), PNG);
    writeFileSync(join(androidDir, "buttons_primarysecondary_paper.png"), PNG);
    // web-only and android-only
    writeFileSync(join(webDir, "modal_open_dark.png"), PNG);
    writeFileSync(join(androidDir, "alertdialog_deleteconfirm_dark.png"), PNG);
    execFileSync("node", [SCRIPT, "--web", webDir, "--android", androidDir, "--out", outFile]);
  });

  it("produces a self-contained HTML file (images inlined as data URIs)", () => {
    expect(existsSync(outFile)).toBe(true);
    const html = readFileSync(outFile, "utf8");
    expect(html).toContain("<html");
    expect(html).toMatch(/data:image\/png;base64,/);
    expect(html).not.toMatch(/src="[^"]*\.png"/); // no file references
  });

  it("pairs shared basenames side by side", () => {
    const html = readFileSync(outFile, "utf8");
    expect(html).toContain("pillbadge_variants_dark");
    expect(html).toContain("buttons_primarysecondary_paper");
    // paired rows show both platform cells
    const pairedSection = html.split("Unmatched")[0];
    expect((pairedSection.match(/data:image\/png;base64,/g) || []).length).toBe(4);
  });

  it("lists unmatched snapshots per platform instead of dropping them silently", () => {
    const html = readFileSync(outFile, "utf8");
    expect(html).toContain("modal_open_dark");
    expect(html).toContain("alertdialog_deleteconfirm_dark");
    expect(html).toMatch(/Unmatched/);
  });

  it("summarizes counts (paired / web-only / android-only)", () => {
    const html = readFileSync(outFile, "utf8");
    expect(html).toMatch(/2\s*paired/i);
    expect(html).toMatch(/1\s*web-only/i);
    expect(html).toMatch(/1\s*android-only/i);
  });
});
