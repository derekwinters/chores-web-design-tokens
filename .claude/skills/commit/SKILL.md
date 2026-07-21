---
name: commit
description: Run the repo's tests, then create a Conventional Commit with proper type and scope.
---

# Commit Skill

Validates the suite passes, then creates a Conventional Commit with the right
type/scope. Stage changes before invoking.

## Usage

```
/commit
```

## Flow

1. Run the test suite: `npm test`
2. Stop if anything fails — report failures; do NOT commit.
3. Review staged/unstaged changes (`git diff --staged`, `git status`).
4. Derive commit type and scope from the actual changes.
5. Create the commit in Conventional Commits format.

## Format

```
<type>(<scope>): <short description>

[optional body explaining why]
```

## Types

`feat` (feature) · `fix` (bug) · `refactor` · `test` · `docs` · `chore`
(build/deps/tooling) · `style` · `perf` · `ci`. Pick by the actual semver impact
of the change, not by what a PR title happens to say.

## Scopes

Use the most relevant of: `tokens, themes, build, android, test`.

## Token-change severity → commit type
Token changes carry an enforced severity → SemVer mapping (the same table in
`CLAUDE.md` and `README.md` — reference it, do not fork it):

| Change | Commit type | SemVer |
|---|---|---|
| Token removed or renamed | `feat!:` / `BREAKING CHANGE:` footer | MAJOR |
| Token added | `feat:` | MINOR |
| Token value changed | `fix:` | PATCH |

The package is `0.x` (`bump-minor-pre-major: true`), so use `feat!:` or a
`BREAKING CHANGE:` footer for a removal/rename regardless, so history stays correct.


## Rules

- Subject ≤72 chars, lowercase, no trailing period, imperative mood ("add" not "added").
- Body only when the "why" is non-obvious.
- This skill never invents a branch or pushes — it only commits.
