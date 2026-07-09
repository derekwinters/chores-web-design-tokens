# Cross-platform layout & component mapping matrix

Canonical mapping between `chores-web-frontend` (React + plain CSS, MUI for the date
picker only) and `chores-web-android` (Jetpack Compose, Material 3), keyed to the token
vocabulary in `tokens/`. Consumer repos link here from their CONTEXT.md/ADRs instead of
duplicating these tables.

Rollout: [derekwinters/chores-web-docs#11](https://github.com/derekwinters/chores-web-docs/issues/11).
Ruling of record: **where the platforms disagreed at migration time, Android's value won.**

## Decisions of record (settled 2026-07-09)

| # | Decision |
|---|---|
| 1 | Web body font stays `DM Sans`; families are per-platform values, metrics unify via the M3 type scale |
| 2 | **No border color token** — borderless flat-surface design; M3 outline defaults for components that need an outline (text fields). Points/gold `#c9a84c` identical in light + dark |
| 3 | Web `--elevation-*` box-shadows are derived from Android's M3 elevation rendering per dp level |
| 4 | **Top bar height = 64** (`size.topbar`, M3 `TopAppBar` default); web migrates from 56 |
| 5 | Activity-log target badges match Android: person → `secondary`, chore → `primary` (web's accent/gold outlines migrate) |

## Layout primitives

| Concept | Web | Compose | Tokens |
|---|---|---|---|
| Block container | `div` + flex column | `Column` / `Box` | `space.*` gaps |
| Inline row | flex row | `Row` | `space.*` gaps |
| Scrolling list | list `div`s (map) | `LazyColumn` | `chore-row` tokens |
| Grid | CSS grid (chore collapsed view: 12-col) | `LazyVerticalGrid` | — |
| Width classes | media queries `breakpoint.sm/md/lg/xl` (600/768/1024/1200); primary mobile switch at `md` 768 | `WindowSizeClass` compact/medium/expanded (600/840) | `breakpoint.*` (web output) |
| Centered form | `max-width: var(--size-form-max)` (400) | `Modifier.widthIn(max = 400.dp)` | `size.form-max` |
| Content wrapper | `max-width: var(--size-content-max)` (1600) | full-width (phone app) | `size.content-max` |

**Navigation pattern is intentionally NOT tokenized**: web keeps sidebar
(`size.sidebar` 240 / `size.sidebar-collapsed` 80, off-canvas drawer < 768) + top bar;
Android keeps bottom `NavigationBar` (5 tabs, due-count `Badge`) + top bar. Shared
values: `size.topbar` (64), nav-item radius `radius.sm`, item padding `space.md`.

## Elevation

| Level | Android (dp / `CardDefaults.cardElevation`) | Web (`--elevation-N`) | Used for |
|---|---|---|---|
| `elevation.0` | 0 | `none` | **cards by default** (Android ruling — web drops resting card shadows) |
| `elevation.1` | 4 | M3-derived shadow @4dp | unselected emphasis tile |
| `elevation.2` | 8 | M3-derived shadow @8dp | stat/dashboard cards |
| `elevation.3` | 12 | M3-derived shadow @12dp | selected tile, modals, toasts; hover lift |
| `elevation.4` | 16 | M3-derived shadow @16dp | selected-tile outer shadow |

Extra: `shadow.accent-glow` (web selection glow) = `0 0 12px rgba(var(--accent-rgb), 0.4)` + elevation.3.

## Typography

M3 default scale is the ramp; web's legacy ad-hoc sizes remap as follows
(web values in rem at 16px base; Android uses the M3 role directly):

| Token role | sp / rem | Replaces on web (legacy) |
|---|---|---|
| `display-small` | 36 / 2.25 | 2.5rem, 3rem stat numbers (8rem hero avatar initial stays layout-driven) |
| `headline-medium` | 28 / 1.75 | 1.75rem, 28px |
| `headline-small` | 24 / 1.5 | 1.5rem, 24px |
| `title-large` | 22 / 1.375 | 1.3rem headings |
| `title-medium` | 16 / 1 | 1rem–1.1rem headings, modal titles |
| `title-small` | 14 / 0.875 | 0.9–0.95rem emphasized text |
| `body-large` | 16 / 1 | 1rem body |
| `body-medium` | 14 / 0.875 | 0.85–0.9rem, 14px body (most common web size) |
| `body-small` | 12 / 0.75 | 0.75–0.8rem, 12–13px secondary text |
| `label-large` | 14 / 0.875 | 0.875rem button labels |
| `label-medium` | 12 / 0.75 | 0.78–0.8rem badge text |
| `label-small` | 11 / 0.6875 | 0.65–0.72rem micro text |
| `brand-title` | 20.8 / 1.3, serif bold, −0.5 tracking | `.app-title`/`.topnav-title` (Playfair Display) ↔ Compose serif top-bar title |
| `micro-label` | label-small + weight 600 + uppercase + 0.05em tracking + `text-muted` | web's recurring uppercase column/label pattern |

Weights: 400/500/600/700 (`font.weight.*`). Off-ramp sizes snap to the nearest role.

## Shape

| Token | Value | Web usage | Android usage |
|---|---|---|---|
| `radius.xs` | 4 | inputs, small controls (46× today) | `RoundedCornerShape(4.dp)` swatches/inputs |
| `radius.sm` | 8 | nav buttons | editor swatches |
| `radius.md` | 12 | cards, modals (`--radius` today) | selected theme tile |
| `radius.pill` | 9999 | buttons, badges (99px/999px today) | `RoundedCornerShape(50)` PillBadge |
| `radius.circle` | 50% | avatars, dots | `CircleShape` |

Web strays 3/6/20px snap to scale. Border widths are widths only (no border color —
decision 2): `border.emphasis` 2, `border.accent-bar` 4, `border.focus-ring` 3.

## Component variants

| Component | Web | Compose | Contract |
|---|---|---|---|
| **Button** | pill, `space.sm`×`space.lg` padding, label-large/500; variants primary/secondary/success/error/warning; disabled `alpha.disabled`, hover `alpha.hover` | `Button`/`TextButton`/`OutlinedButton` on M3 defaults; extra M3 variants (tonal, elevated) are **Android-only extensions** | semantic variant names shared; web `.btn-*` classes bind to tokens |
| **Icon action** (in-card) | flat icon button, transparent bg, semantic tint, `icon.sm` | `IconButton` + tint (Complete → success, Delete → error, rest → text-muted) | identical tint mapping both platforms |
| **TextField** | `form-field` tokens: `radius.xs`, ~10×12 padding, M3-outline border, focus ring 3px accent @ `alpha.tint-subtle`, `micro-label` labels | `OutlinedTextField` (M3). **MUI `standard` variant is disallowed** (date-picker bridge included) | outlined is the only text-field style |
| **Card** | `radius.md`, `color.surface`, **flat**, hover → `surface2` | `Card` + `cardElevation(0.dp)` default | stat cards `elevation.2`; selected `elevation.3` |
| **Chore row** | outer 16×8, inner 16 (20 with bar), accent bar 4px: due → error, complete → text-muted; collapsed layout matches Android | same values (`ChoreListScreen`) | the flagship shared component |
| **Pill badge** | `radius.pill`, 10×4 padding, fill = semantic @ `alpha.tint` (0.15), text label-medium | `PillBadge` composable (same values) | action colors: completed/created → success; skipped/reassigned/password_* → warning; deleted → error; else text-muted. Targets: person → secondary, chore → primary (decision 5) |
| **Dialog/Modal** | `size.modal-max` 540, `radius.md`, `color.overlay` backdrop, 20px padding, surface-contrast header (no divider) | `AlertDialog`/`DatePickerDialog` (M3 defaults) | destructive confirms use error-tinted confirm action |
| **Top bar** | height 64 (decision 4), `brand-title`, `avatar.md` 32 circle menu | `TopAppBar` 64dp, serif title, 32dp avatar `navigationIcon` | per-screen actions stay platform-specific |
| **Toast/Snackbar** | slide-up + fade `duration.md`, `radius.md`, `elevation.3` | `Snackbar` (M3) | — |
| **Avatar** | circle, 32/40/128 | 32dp circle, bold initial | `avatar.md/lg/hero` |

## Motion

| Pattern | Web | Compose | Tokens |
|---|---|---|---|
| Top-level nav switch | fade-through where SPA allows | `fadeIn(tween(300)) + scaleIn(0.92, tween(300))` / `fadeOut` | `duration.lg`, `motion.scale-in-start` |
| Drill-in | shared-axis horizontal where SPA allows | `slideIntoContainer(Left/Right, tween(300)) + fade` | `duration.lg` |
| Hover/color micro | 200ms ease | — (touch) | `duration.md`, `easing.standard` |
| Press micro | 150ms | ripple (M3 default) | `duration.sm` |
| Spinner | 1000ms linear | `CircularProgressIndicator` (M3) | `duration.spinner`, `easing.linear` |

## Runtime theming (Tier 2)

Both platforms resolve the 9 runtime slots from `GET /theme/current` over the token
defaults. Slot ↔ platform mapping:

| Token role (API field) | Web custom property | Compose `ColorScheme` slot |
|---|---|---|
| `background` (`bg`) | `--bg` | `background` |
| `surface` | `--surface` | `surface` |
| `surface2` | `--surface2` | `surfaceVariant` |
| `primary` | `--primary` | `primary` |
| `secondary` | `--secondary` | `secondary` |
| `accent` | `--accent` | `tertiary` |
| `success` / `warning` | `--success` / `--warning` | no M3 slot — `LocalThemeOption` |
| `error` | `--error` | `error` |

Light/dark mode = background luminance > 0.5 (both platforms, unchanged); the token
`color.dark`/`color.light` sets are the explicit defaults (dark = backend "dark",
light = backend "paper"). Derived roles (`text`, `text-muted`, `on-primary`, `overlay`,
`points`) and the `--*-rgb` tint triplets regenerate on theme application.
