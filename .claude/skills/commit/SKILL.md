---
name: commit
description: Run tests and create conventional commit with proper type and scope
---

# Commit Skill

Validates all tests pass, then creates a Conventional Commit with proper type/scope.

## Usage

```
/commit
```

## Flow

1. Run the test suite (`npm test` — runs the Style Dictionary build via
   `node build.js`, then the vitest suite)
2. Stop if any tests fail — report failures
3. Review staged/unstaged changes
4. Derive commit type and scope from changes
5. Create commit using Conventional Commits format

## Commit Format

```
<type>(<scope>): <short description>

[optional body explaining why]
```

## Types

- `feat` - new feature
- `fix` - bug fix
- `refactor` - code restructuring
- `test` - test additions/changes
- `docs` - documentation
- `chore` - build/deps/tooling
- `style` - formatting
- `perf` - performance
- `ci` - CI/CD changes

## Scopes

- `tokens` - DTCG token sources (`base`/`semantic`/`component` tiers)
- `themes` - built-in runtime theme palettes
- `build` - Style Dictionary config (`style-dictionary.config.js`,
  `build.js`), platform outputs
- `android` - the `android-artifact/` Gradle wrapper that packages the
  generated Kotlin constants as a Maven artifact
- `test` - vitest specs
- Use most relevant scope

## Token-change severity → commit type

Token changes carry an enforced severity → SemVer mapping. This is the same
table documented in `CLAUDE.md` (`## Releases`) and `README.md` — reference
it, do not fork it:

| Change | Commit type | SemVer |
|---|---|---|
| Token removed or renamed | `feat!:` / `BREAKING CHANGE:` footer | MAJOR |
| Token added | `feat:` | MINOR |
| Token value changed | `fix:` | PATCH |

The package is still `0.x` (`bump-minor-pre-major: true`), so a pre-1.0
`feat:` bumps MINOR even when it renames/removes a token — use `feat!:` or a
`BREAKING CHANGE:` footer regardless for a removal/rename, so the history
stays correct once the package promotes to `1.0.0`.

## Rules

- Subject line ≤72 characters, lowercase, no period
- Imperative mood: "add" not "added"
- Body only when "why" is non-obvious
- Stage changes before invoking
