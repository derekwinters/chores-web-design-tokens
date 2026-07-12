# CLAUDE.md — Developer and AI Agent Reference

This repo is the Style Dictionary-based design token source of truth for
chores-web: DTCG-format token sources in `tokens/` build to a web artifact
(`dist/web/tokens.css`, `dist/web/tokens.js`) consumed by
`derekwinters/chores-web-frontend` and an Android artifact
(`dist/android/DesignTokens.kt`) consumed by `derekwinters/chores-web-android`.
The npm package (`@derekwinters/design-tokens`) is distributed as a tarball
attached to each GitHub Release, not via npm-registry install — see the
README's "zero-auth decision of record" before assuming a normal `npm
install` path. The Maven artifact publishes to GitHub Packages for the
Android client.

Token change severity is a real, enforced convention here, not a
suggestion — see `## Releases` below.

## Releases

Versioning is fully automated by release-please (config and manifest under
`.github/release-please/`, shared workflow from `chores-web-actions`). It
parses commit history on `main`, and **when a PR is squash-merged, the
squash-merge commit title IS the conventional commit release-please parses
— there is no separate "real" commit message**. An unparseable or
misformatted squash title does not just look wrong: it silently produces no
release-please entry, so the change ships unreleased with no version bump
and no changelog line. This exact failure already happened once in a
sibling repo when an orchestrating session merged with the raw PR title
instead of a conventional-commit-formatted one — treat the rule below as
non-negotiable, not a style preference.

Token-change severity maps to commit type like this (confirmed against the
table already documented in `README.md`, keep both in sync if it changes):

| Change | Commit type | SemVer |
|---|---|---|
| Token removed or renamed | `feat!:` / `BREAKING CHANGE:` footer | MAJOR |
| Token added | `feat:` | MINOR |
| Token value changed | `fix:` | PATCH |

Note: this package is still `0.x` (`bump-minor-pre-major: true` in
`.github/release-please/config.json`), so a pre-1.0 `feat:` bumps MINOR even
when it renames/removes a token — use `feat!:` or a `BREAKING CHANGE:`
footer regardless, so the changelog and history stay correct once the
package promotes to `1.0.0`.

## Conventional Commits — required for every commit on `main`

Every commit landing on `main` — and especially every squash-merge PR
title — must be a valid Conventional Commit:

```
type(scope): description
```

`type` must match the actual semver impact of the change, one of: `feat`,
`fix`, `chore`, `ci`, `docs`, `build`, `refactor`, `test`, `perf`, `revert`.
Mark breaking changes with a `!` after the type/scope (`feat!:`) or a
`BREAKING CHANGE:` footer — release-please requires one of those two forms
to cut a MAJOR (or, pre-1.0, to flag a change as breaking despite a MINOR
bump).

Before merging any PR here, check the exact squash-merge title release-please
will see — not just that a PR description mentions "conventional commits."

## Delegate commit-authoring work — do not author commits directly

If you are an orchestrating/main Claude Code session: do not write the
token/config change, craft the commit message, or open the PR yourself.
Delegate that work to an implementation agent. The orchestrating session's
job is to delegate the work, review CI results, and merge — and when it
merges, it still owns getting the squash-merge title right per the rule
above. This split exists because the incident that prompted this file was
an orchestrating session merging PRs directly using the raw PR title,
bypassing any conventional-commit check.

## Orientation

- `tokens/` — DTCG JSON sources, three-tier alias chain (`base` → `semantic`
  → `component`); light/dark are explicit first-class sets.
- `themes/` — the six built-in runtime theme palettes (pure data).
- `style-dictionary.config.js` — web (`chores/web`) and Android
  (`chores/compose`) platform configs.
- `npm test` runs the Style Dictionary build plus the vitest suite — the
  tests are the token spec, run them before proposing any token change.
- `android-artifact/` — Gradle project that packages the generated Kotlin
  constants as a Maven artifact.

See `README.md` for the full architecture write-up, design decisions of
record, and the two-tier (static tokens vs. runtime `/theme` API) theming
model.
