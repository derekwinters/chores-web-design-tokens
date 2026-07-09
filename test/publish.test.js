// Smoke checks for the publish pipeline configuration (issue #4):
// npm package publishability + Maven artifact module + release workflow gating.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
const read = (rel) => readFileSync(ROOT + rel, "utf8");

describe("npm package publish config", () => {
  const pkg = JSON.parse(read("package.json"));
  it("targets GitHub Packages and ships only dist/", () => {
    expect(pkg.publishConfig.registry).toBe("https://npm.pkg.github.com");
    expect(pkg.files).toEqual(["dist"]);
  });
  it("builds before publishing (dist/ is gitignored)", () => {
    expect(pkg.scripts.prepublishOnly).toContain("build");
  });
});

describe("maven artifact module (android-artifact/)", () => {
  it("exists with gradle wrapper and build script", () => {
    for (const f of [
      "android-artifact/build.gradle.kts",
      "android-artifact/settings.gradle.kts",
      "android-artifact/gradlew",
      "android-artifact/gradle/wrapper/gradle-wrapper.properties",
      "android-artifact/gradle/wrapper/gradle-wrapper.jar",
    ]) {
      expect(existsSync(ROOT + f), `${f} must exist`).toBe(true);
    }
  });
  it("publishes com.derekwinters.chores:design-tokens to GitHub Packages Maven", () => {
    const gradle = read("android-artifact/build.gradle.kts");
    expect(gradle).toMatch(/com\.derekwinters\.chores/);
    expect(gradle).toMatch(/design-tokens/);
    expect(gradle).toMatch(/maven\.pkg\.github\.com\/derekwinters\/chores-web-design-tokens/);
    expect(gradle).toMatch(/maven-publish/);
  });
  it("compiles the generated Kotlin from dist/android", () => {
    const gradle = read("android-artifact/build.gradle.kts");
    expect(gradle).toMatch(/dist\/android/);
  });
});

describe("PR CI compiles the maven artifact", () => {
  it("pr.yml runs the gradle build against the generated Kotlin", () => {
    const yml = read(".github/workflows/pr.yml");
    expect(yml).toMatch(/gradlew build/);
    expect(yml).toMatch(/working-directory:\s*android-artifact/);
  });
});

describe("release workflow publish jobs", () => {
  const yml = read(".github/workflows/release.yml");
  it("publishes npm + maven only when release-please created a release", () => {
    expect(yml).toMatch(/publish-npm:/);
    expect(yml).toMatch(/publish-maven:/);
    const gates = yml.match(/if:\s*needs\.release-please\.outputs\.release_created/g) || [];
    expect(gates.length).toBeGreaterThanOrEqual(2);
  });
  it("npm publish authenticates against GitHub Packages", () => {
    expect(yml).toMatch(/npm\.pkg\.github\.com\/:_authToken/);
    expect(yml).toMatch(/NODE_AUTH_TOKEN/);
  });
  it("maven publish passes the released version to gradle", () => {
    expect(yml).toMatch(/-Pversion=\$\{\{ needs\.release-please\.outputs\.version \}\}/);
  });
  it("only SHA-pinned action refs are used (repo policy)", () => {
    for (const file of [".github/workflows/pr.yml", ".github/workflows/release.yml"]) {
      const uses = read(file).match(/uses:\s*\S+/g) || [];
      expect(uses.length).toBeGreaterThan(0);
      for (const u of uses) {
        expect(u, `${file}: ${u}`).toMatch(/@[0-9a-f]{40}/);
      }
    }
  });
});
