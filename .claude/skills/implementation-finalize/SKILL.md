---
name: implementation-finalize
description: Push branch to origin and create pull request. Does NOT commit — commits happen at doc-pre and after user approval. Removes in-development label. PR title uses conventional commit format.
---

# Implementation Finalize Skill

Pushes branch to origin and creates the pull request. Commits are made at earlier stages; this skill handles push and PR creation only.

## Usage

```
/implementation-finalize <issue-number> <commit-type>
```

## Workflow

1. **Push branch**: `git push -u origin <branch-name>`
2. **Create PR**:
   - Title: conventional commit format — `<type>: <description> (#<number>)`
   - Body: opens with `## Deviations and Decisions` (the block composed at the
     orchestrator's reflect state, `None.` under any empty subsection), then
     `## Summary` bullets, then `## Implementation`, then `Closes #<number>` on
     its own line (see PR Format below)
3. **Remove `in-development` label**: `gh issue edit <N> --remove-label "in-development"`
4. **Return PR URL**

## Parameters

- `issue_number` (required): GitHub issue number
- `commit_type` (required): Type of commit (feat, fix, refactor, docs, test, chore)

### Choosing `commit_type` for a token change

The PR title (and squash-merge title) is the conventional commit release-please
parses. For token changes, pick the type from the enforced severity table —
the same one documented in `CLAUDE.md` (`## Releases`) and `README.md`;
reference it, do not fork it:

| Change | Commit type | SemVer |
|---|---|---|
| Token removed or renamed | `feat!:` / `BREAKING CHANGE:` footer | MAJOR |
| Token added | `feat:` | MINOR |
| Token value changed | `fix:` | PATCH |

The package is still `0.x` (`bump-minor-pre-major: true`), so a pre-1.0
`feat:` bumps MINOR even for a rename/removal — use `feat!:` or a
`BREAKING CHANGE:` footer regardless so the history stays correct once the
package promotes to `1.0.0`. Non-token PRs (docs, tooling, this kind of
`.claude/` port) take the ordinary type for their actual impact.

## PR Format

The body opens with `## Deviations and Decisions` (composed by the orchestrator
at its reflect state), present even when empty, followed by `## Summary`,
`## Implementation`, and a bare `Closes #<number>` line:

```
Title: <type>: <description> (#<issue-number>)

Body:
## Deviations and Decisions

### Deviations
- **<file/area>**: <what deviated from the contract and why>.

### Decisions
- **<ambiguity>**: <how it was resolved>.  Prevention: <what would prevent recurrence>.

## Summary
- <bullet points summarizing changes>

## Implementation
- Tokens/Build: <what changed in tokens/, themes/, or the build config, and which dist/ artifacts>
- Tests: <what was tested>

Closes #<issue-number>
```

An empty `### Deviations` or `### Decisions` subsection emits `None.` under its
heading (the heading still appears).

## Milestone Mode

When invoked with `existing_pr` (milestone mode), this skill pushes to the existing shared branch and does **not** create a PR or touch the PR body — the milestone orchestrator owns the PR body exclusively (see `milestone-implementation-orchestrator.md`). It returns a short summary (issue number, title, commit subject) for the orchestrator to use when ticking that issue's checkbox.

## Notes

- Does NOT stage or commit — commits happen at:
  - doc-pre stage: `docs:` commit for documentation updates
  - after user approval: `feat:/fix:/refactor:` commit for code changes
  - doc-validate stage: `docs:` commit if corrections needed (conditional)
- PR title must follow conventional commit format
- "Closes #N" must appear on its own line to trigger GitHub auto-close (standalone mode)
- `in-development` label removed at this step (not at commit time) in standalone mode; in milestone mode the milestone orchestrator removes it after each issue completes
