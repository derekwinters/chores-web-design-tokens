# chores-web-design-tokens

Single source of truth for chores-web design values, consumed by
[`chores-web-frontend`](https://github.com/derekwinters/chores-web-frontend) (npm)
and [`chores-web-android`](https://github.com/derekwinters/chores-web-android) (Maven).

Architecture blueprint: [#2](https://github.com/derekwinters/chores-web-design-tokens/issues/2) ·
rollout master issue: [derekwinters/chores-web-docs#11](https://github.com/derekwinters/chores-web-docs/issues/11).

## Layout

- `tokens/` — DTCG-format JSON sources, three-tier alias chain (`base` → `semantic` → `component`).
  Light and dark are explicit first-class sets (`color.dark.*`, `color.light.*`).
- `style-dictionary.config.js` — the two platform configs and custom transform groups
  (`chores/web`, `chores/compose`).
- `dist/` (generated, not committed) —
  `web/tokens.css` (CSS custom properties; `:root` = dark prepaint set),
  `web/tokens.js` (ESM module with all sets and scales),
  `android/DesignTokens.kt` (Kotlin constants).

```sh
npm ci
npm test    # style-dictionary build + vitest suite (the tests ARE the token spec)
```

## Built-in theme palettes (`themes/`)

The six built-in runtime palettes (dark, light, charcoal, paper, pink, frog) live here as
pure data — one JSON file per theme, keyed by the canonical role names. The build emits
`dist/themes.json` keyed by the backend API field names (`background` → `bg`), shipped in
both artifacts; once `chores-web-backend` consumes it, **this repo is the source of truth
for the palettes**. Editing a palette value is a `fix:` (PATCH); adding a theme file is a
`feat:` (MINOR) — no code change needed either way.

## Two-tier theming model

These are the **static** (Tier 1) tokens. The backend `/theme` API (Tier 2) overrides the
nine runtime color slots (`background/bg, surface, surface2, primary, secondary, accent,
success, warning, error`) at runtime — tokens define the canonical vocabulary and the
default values, never replace the runtime override.

## Design decisions of record

- **Android wins**: where web and Android disagreed at migration time, the Android app's
  value became the token value (spacing 4/8/12/16/24, M3 type scale, flat cards, 300 ms
  navigation motion).
- **No border color**: borderless flat-surface design. There is no `color.border` /
  `border.default`; components that need an outline (text fields) use the Material 3
  outline default. `border.*` tokens are widths only (emphasis / accent-bar / focus-ring).
- **Points/gold** (`color.*.points`, `#c9a84c`) is identical in light and dark sets.
- **Web shadows** (`elevation.N.web`) are derived from Android's Material elevation
  rendering (key shadow `0 {dp/2}px {dp}px @ 0.30` + ambient `0 {dp}px {dp*2.5}px @ 0.15`).
- **Top bar height 64** (M3 `TopAppBar` default).
- **Web body font stays DM Sans**; font families are per-platform values, metrics unify
  via the shared type scale.

## Versioning (release-please — pin, don't float)

Releases are cut by [release-please](https://github.com/googleapis/release-please) from
**conventional commits** on `main` (shared workflow in `chores-web-actions`):

| Change | Commit type | SemVer |
|---|---|---|
| Token **removed or renamed** | `feat!:` / `BREAKING CHANGE` | MAJOR |
| Token **added** | `feat:` | MINOR |
| Token **value changed** | `fix:` | PATCH |

Consumers pin exact published versions — never `main`/`latest`. Dependabot proposes
bumps; merging the bump PR is the explicit opt-in to a new design version.

Currently `0.x`: minor bumps may still rename tokens. Promote to `1.0.0` once both
consumers are wired (rollout Iteration 2).
