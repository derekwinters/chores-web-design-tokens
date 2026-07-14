---
name: implementation-verify
description: Verify the change is present in all built dist/ artifacts and show changes summary for user review
---

# Implementation Verify Skill

Inspects the built `dist/` artifacts to confirm the change actually made it
through the Style Dictionary build into every platform output, then shows a
summary of changes for user review.

## Usage

```
/implementation-verify <issue-number>
```

## Workflow

1. **Ensure a fresh build**: the change must be reflected in `dist/`. `npm
   test` (run in the test state) already runs `node build.js`; if `dist/` may
   be stale, re-run `npm run build`.
2. **Inspect the built artifacts** — confirm the change is present in all
   three platform outputs (a token change must appear in every one; a change
   that only lands in one artifact is a build-config bug):
   - `dist/web/tokens.css` (CSS custom properties)
   - `dist/web/tokens.js` (JS/ESM export)
   - `dist/android/DesignTokens.kt` (Compose/Kotlin constants)
3. **Prepare changes summary**:
   - List all files modified (sources under `tokens/`, `themes/`, config)
   - Show line change counts
   - Summarize implementation
   - Display test results and which artifacts were confirmed
4. **Pause workflow**: Wait for user approval or request for changes

## Parameters

- `issue_number` (optional): For reference in output

## Output

Shows:
- Source files modified with line counts
- Implementation summary
- Test results
- Artifact verification: the change confirmed in `tokens.css`, `tokens.js`,
  and `DesignTokens.kt`
- Ready for user to:
  - Approve for commit
  - Request more changes
  - Abort

## Notes

- Called by orchestrator after tests pass
- Artifact inspection confirms the token/config change propagated to every
  platform output, not just that the build exited cleanly
- Shows all changes before user reviews
- User has control point here
