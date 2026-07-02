## Wrapping and setup

This DS is dark-themed and has no theme/context provider — components are plain, prop-driven functions. There is nothing to wrap them in. But every real screen wraps its content in a root container carrying the base surface color, or components (especially `ghost`/border-only variants like `Button` variant `"ghost"`, `Callout`, `IconButton`) render wrong — invisible borders, unreadable transparent backgrounds — because they're designed against that dark backdrop, not a white page:

```jsx
<div className="min-h-screen bg-bg-base font-sans">
  {/* your composition */}
</div>
```

`font-sans` resolves to the Geist family (see Fonts below). Nest `bg-bg-panel` / `bg-bg-raised` / `bg-bg-sunken` surfaces (via `Card` variants, or directly) inside that root for elevation — never render DS components directly on a plain white background.

## Styling idiom

This is a Tailwind v4 utility-class system with a **named semantic token layer** — never use raw Tailwind palette classes (`bg-gray-900`, `text-white`, `border-red-500`, etc.), always use this DS's own semantic classes, which map to real CSS custom properties shipped in `_ds_bundle.css`:

| Purpose | Classes |
|---|---|
| Surfaces | `bg-bg-base` (page), `bg-bg-panel` / `bg-bg-panel-strong` (cards, tables), `bg-bg-raised` (modals, popovers), `bg-bg-sunken` (recessed / inputs), `bg-bg-hover` / `bg-bg-hover-strong` (hover states) |
| Borders | `border-border-default`, `border-border-subtle`, `border-border-faint` / `border-border-faintest` / `border-border-hairline` (progressively quieter dividers), `border-border-strong` (emphasis, active state) |
| Text | `text-text-primary` (headings, primary content), `text-text-secondary`, `text-text-muted`, `text-text-faint`, `text-text-disabled` |
| Accents (status/tone) | `-accent-success`, `-accent-error`, `-accent-warning` (+ `-accent-warning-text` for on-warning text), `-accent-info` — used as `text-`, `bg-`, or `border-` prefixes, usually at low opacity for backgrounds (e.g. `bg-accent-error/7`, `border-accent-warning/30`) |
| Source/platform accents | `-accent-audio`, `-accent-web`, `-accent-youtube`, `-accent-linkedin`, `-accent-pinterest`, `-accent-tag-ai` — used on `Badge` to color-code content sources and AI-derived tags |
| Type | `font-sans` (UI text, default), `font-mono` (data, timestamps, code, eyebrow labels, badges) — this DS mixes both deliberately, mono for anything "data-like" |

Sizing and spacing are mostly explicit pixel values via Tailwind arbitrary values (`text-[13px]`, `px-[18px]`, `rounded-[10px]`) rather than the default Tailwind scale — match that granularity rather than snapping to `text-sm`/`p-4`/etc. when extending these components.

## Where the truth lives

Read `styles.css` (imports `_ds_bundle.css`, which contains every `--color-*` custom property and all compiled utility classes) before styling anything new. Read each component's `<Name>.prompt.md` for its real usage — several are compound (`Table.Head`, `Table.Row`, `Table.HeadCell`, `Table.EmptyRow` are all on the `Table` export, not separate components) or composite (e.g. `SummarySection`, `PendingTable`, `FailedTable`, `InFlightTable` already assemble `SectionHeader` + `SqlHint` + `Table` — prefer composing with these over rebuilding the pattern from primitives).

## Example

```jsx
const { Card, Badge, ProgressBar } = window.BookmarkDS;

<div className="min-h-screen bg-bg-base font-sans p-8">
  <Card variant="panel" className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <Badge tone="success" size="pill" dot>live</Badge>
      <span className="text-[13px] text-text-primary">Embedding qwen2.5:7b</span>
    </div>
    <div className="w-[120px]">
      <ProgressBar percent={72} fill="success" />
    </div>
  </Card>
</div>
```
