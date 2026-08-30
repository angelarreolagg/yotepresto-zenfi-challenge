# STYLEGUIDE.md — Design system

The visual system for this project, derived from Revolut's iOS app (§12). The values below are
final, not suggestions.

**Two rules outrank everything else:**

1. Where a visual choice fights the legibility of a figure, **legibility wins**. The numbers are the
   product.
2. **No animation may decide whether content is visible** (§9).

---

## 1. What we take from Revolut

Five properties, and they only work together:

1. **True black background.** Not near-black, not tinted. `#000000`. Cards read as elevated because
   the ground is absolute.
2. **Solid surfaces.** Elevation is a lighter grey card on black, never blur or transparency. There
   is exactly **one** sanctioned exception, the scrolled top bar (§5.1).
3. **Enormous numbers**, with the decimal part rendered smaller than the integer part.
4. **Saturated colour used sparingly** — category discs, chart arcs, one blue action accent. Never
   a background wash.
5. **Generous vertical air.** Rows breathe; groups separate by space, not by dividers.

Visual weight goes: **number → chart → category colour → everything else.**

---

## 2. Tokens

Tailwind v4 `@theme` in `src/app/index.css`, so there is no `tailwind.config.js` to drift from them.
**No hex literals in components** — the sole exception is the category series (§4), which feeds SVG
and inline-style attributes rather than classNames.

```css
@theme {
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

  --color-background: #000000;      /* true black, the whole page */
  --color-surface: #1c1c1e;         /* cards, the top bar */
  --color-surface-raised: #2c2c2e;  /* controls on a card, sheets, hover */
  --color-surface-sunken: #141416;  /* inset blocks inside a card */

  --color-border: #2c2c2e;
  --color-border-strong: #3a3a3c;   /* also the scrollbar thumb */

  --color-text-primary: #ffffff;
  --color-text-secondary: #8e8e93;  /* labels, timestamps, secondary rows */
  --color-text-muted: #636366;      /* disabled, tertiary */

  --color-accent: #0a84ff;          /* the single action accent */
  --color-positive: #30d158;
  --color-negative: #ff453a;        /* nothing routine — see §3 */
  --color-warning: #ffd60a;
}
```

**Radii:** `rounded-2xl` cards, `rounded-xl` nested blocks, `rounded-full` for pills, chips, icon
buttons, avatar discs and the search field.

**Spacing:** card padding `p-3 sm:p-4`; gaps inside a card `gap-2.5 sm:gap-3`; between cards
`gap-3 sm:gap-6 lg:gap-8`. Air is a feature, but on a phone it competes with data — §6.1 settles
that fight.

**Avatar colours** live in `shared/config/users.ts`, drawn from the category series (`#7b61ff`,
`#32d4e6`, `#ff9f0a`). **Deliberately not the accent**, which means "interactive" everywhere else.

---

## 3. Typography and numbers

Inter, with `font-variant-numeric: tabular-nums` on `body` so figures do not jitter when a
correction changes them.

| Role                    | Size / weight                                                                  | Colour    |
| ----------------------- | ------------------------------------------------------------------------------ | --------- |
| Headline figure (donut) | `text-[1.4rem] sm:text-[2.1rem] lg:text-[1.6rem]` `font-bold` `tracking-tight` | primary   |
| Period title (top bar)  | `text-base sm:text-xl lg:text-2xl` `font-bold`                                 | primary   |
| Section title           | `text-lg sm:text-xl` `font-bold`                                               | primary   |
| Category row            | `text-sm sm:text-base` `font-medium`                                           | primary   |
| Row amount              | `text-sm sm:text-base` `font-semibold` `tabular-nums`                          | see below |
| Row subtitle, labels    | `text-xs sm:text-sm`                                                           | secondary |
| Group header, metadata  | `text-xs`                                                                      | secondary |

The headline is **smaller at `lg` than at `sm`** on purpose: in the two-column layout the card is
narrower and shares a column with the whole category list, so a figure sized for a full-width phone
card would dominate it.

**The decimal trick.** The headline figure renders its fractional part at `text-[0.6em]`, same
weight — `$79`**`.9k`**. Apply it **only** there, never to row amounts, where it breaks the tabular
alignment that makes a column scannable.

**Amount colour is meaningful, so use it sparingly.** Expenses — the overwhelming majority —
are **primary white** with a `−`; painting them red turns the whole list red and destroys the
signal. Income is green with a `+`. Zero is muted. The **Net** figure is the one place a negative
reads red, because there the sign *is* the message.

**The minus sign is U+2212 (`−`), not a hyphen.** It aligns with the digits.

**Formatting is `Intl`, and it has four traps:**

1. `currencyDisplay: 'narrowSymbol'` everywhere, or `en-US` renders MXN as `MX$` — which does not
   fit inside the donut and spells the same figure two ways depending on interface language.
2. `notation: 'compact'` puts the symbol **after** the number in `es-MX` (`79.9 k$`). Prepend it by
   hand.
3. Build dates from the calendar key at **UTC midnight and format in UTC**, so the rendered day is
   the one in the data regardless of the viewer's timezone.
4. The one place a foreign amount appears uses `currencyDisplay: 'code'` — "$12.00 converted to
   $222.00" reads as one currency; "USD 12.00" cannot be misread.

---

## 4. Category identity

One map, shared by chart, breakdown list, rows and modal, in
`entities/transaction/ui/categoryTheme.ts` as `Record<Category, string>` and
`Record<Category, LucideIcon>` — so adding a category and forgetting a colour is a **compile error**.

**Icons sit on a solid saturated disc with a white glyph** — 40px (`h-8 w-8` in dropdowns),
`rounded-full`, category colour at full strength, glyph white, `strokeWidth 2`. Not a tinted
low-alpha treatment: that saturation is what makes a long list scannable at a glance.

```ts
Vivienda: '#7b61ff'       Supermercado: '#0a84ff'   Comida: '#32d4e6'
Transporte: '#ff9f0a'     Compras: '#ff6482'        Entretenimiento: '#bf5af2'
Salud: '#30d158'          Servicios: '#ffd60a'      Seguros: '#5e9eff'
Suscripciones: '#ff453a'  Viajes: '#40c8b0'         Comisiones: '#d4a72c'
Ingresos: '#30d158'       Pagos: '#8e8e93'          Efectivo: '#7d7d82'
Transferencias: '#636366' Sin categoría: '#48484a'  Otros: '#3a3a3c'
```

Transfers, cash and uncategorized are **deliberately grey**: they are not spending, and colour would
imply they belong in the chart's story.

Read the icon map with `createElement`, not by assigning to a capitalised binding during render —
that trips `react-hooks/static-components`.

---

## 5. Surfaces and elevation

```
#000000  page
  └── #1c1c1e  card / top bar     ← rounded-2xl, no border
        └── #2c2c2e  control      ← pills, buttons, inputs, sheets
        └── #141416  inset block  ← week navigator, detail panel, insight card
```

- **Cards carry no border by default.** The contrast between `#1c1c1e` and `#000000` is the edge.
  Add `border-border` only when two surfaces of the same level sit adjacent.
- **Shadows are unnecessary on true black** and read as grey haze. Skip them, except on portaled
  overlays where they separate the sheet from the dimmed page.
- Hover/pressed on a row: step the surface one level lighter. No scale, no colour shift.
- Tap feedback: `active:scale-90` (icon buttons) or `active:scale-[0.97]` (wide buttons), 100 ms.

### 5.1 The one blur exception

The top bar is solid at rest and becomes `bg-surface/75 backdrop-blur-xl` past 8px of scroll.
Nothing else is translucent.

It is safe **only because it is contained**: everything below stays a solid surface, and every
overlay is portaled to `document.body`, so the blur can never become the containing block for a
`fixed` descendant (§8). If you find yourself adding a second `backdrop-blur`, you are no longer
building this design.

### 5.2 The two ornamental objects

Exactly two elements may be more than flat colour, and both belong to the insight card — the one
element on the screen that represents a **result** rather than a fact. Everywhere else, §11 stands:
no glow.

**The orb** (`components/Orb.tsx`) is a WebGL fragment shader: an eight-step opal-interference field
in violet, drawn on a 112×112 backing store and scaled down by CSS to 32–48px.

- **WebGL, not WebGPU** — WebGPU has no Safari and no Firefox, and a decorative sphere that renders
  nothing on a third of browsers is not a feature.
- **Two states, differing only in speed** (`0.7` at rest, `1.5` while thinking) and size. It keeps
  the same violet throughout, so settling reads as the same object catching its breath rather than
  a different object appearing.
- A three-blob CSS sphere sits underneath as the fallback, hidden once the canvas is live
  (`[data-gl='true']`). A lost context returns the element to it.

**The lit border** (`components/BorderGlow.tsx`) sweeps a cone of light around the insight card's
edge once, when the sentence lands, and again on every re-run.

- The light must live **in the ring, not in the fill**, which the component achieves structurally: a
  mesh gradient clipped to `border-box` under a conic mask, a near-edge fill on `padding-box` at
  `soft-light`, and an outer glow inset **outside** the card at `plus-lighter`.
- **One pass, then rest.** A permanently lit border is decoration competing with the numbers.
- Its cleanup must return the border to rest, or a sweep cancelled part-way parks a lit arc on the
  card until the next one finishes — which is what pressing re-run does.
- Never add a `box-shadow` on top to "help" the glow. That puts light back into the fill and
  reintroduces the exact problem the masking exists to prevent.

---

## 6. Layout

### 6.1 The mobile fold is a budget

At **390×844**, before any scrolling, the user must see: the whole donut with its headline figure,
the insight, the top 3 categories, income, net, and the first rows of the most recent week.

Everything competing with that loses. The reductions this forces, all `< sm` only:

| Removed on a phone                                                    | Bought back |
| --------------------------------------------------------------------- | ----------- |
| The three filter dropdowns, collapsed behind a toggle beside search    | ~90px       |
| The `Movimientos` heading, `sr-only` (still announced, just not painted) | ~36px     |
| The `PERIODO` label above the month title                              | ~18px       |
| The week summary folded between the arrows instead of its own row      | ~27px       |
| The profile and language dropdowns, moved into the side sheet          | bar width   |

**Measure, do not guess.** Open the viewport and count. This budget is tight enough that a single
un-measured addition pushes the third transaction below the fold.

### 6.2 Growing to a wide screen

Mobile-first, one column, then **two columns from `lg`**:

```
grid-cols-1  lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]  lg:items-start
```

The analysis stays left while the evidence scrolls right. A single narrow rail centred on a 1440px
display wastes two thirds of the screen and reads as an unfinished page.

Page width is decided in **one** place, shared by the sticky bar and the content so their left edges
cannot drift:

```
mx-auto w-full max-w-md px-4 sm:max-w-2xl sm:px-6 md:max-w-3xl lg:max-w-6xl lg:px-8 xl:max-w-7xl
```

`sm:`/`lg:` react to the **viewport**, not the container. Apply them where the container actually
grows; strip them from components inside a fixed-width column, where they would flip layouts that
never got more room.

**The right column caps its own height** rather than letting the page scroll:
`lg:max-h-[25.5rem] lg:overflow-y-auto` on the row list, ~6 rows. Two full cards on screen at once
beats one card and a scrollbar.

### 6.3 Three patterns, no fourth

- **A. Card with an inset header block.** The week navigator: a `surface-sunken` block inside a
  `surface` card, holding a range, a count and an aggregate.
- **B. Icon row.** 40px coloured disc · title + subtitle stacked · right-aligned amount · optional
  trailing control. `gap-2.5 sm:gap-3`, `py-2 sm:py-3`. **No dividers** — spacing separates rows.
- **C. Label/value row.** In detail panels: label left in secondary, value right in primary.
  Interactive values render in accent blue, the only place blue text appears.

**Controls.** Segmented pills for mutually exclusive options (active pill on `surface-raised` over a
`surface-sunken` track). Search is a full-width `rounded-full` field in `surface-raised` with a
leading magnifier. Icon buttons are 32/36px `rounded-full` discs in `surface-raised`.

### 6.4 Scrollbars

The platform scrollbar is a light, wide bar that cuts across a dark rounded panel and squares off
its corner. Every scroll container here takes `.scroll-slim`: 6px, no track, a
`--color-border-strong` thumb, `scrollbar-width: thin`.

---

## 7. Charts

- **Donut**: `innerRadius 62%`, `outerRadius 92%`, `paddingAngle 2`, `cornerRadius 4`,
  `stroke="none"`. Arc thickness is what makes it read as Revolut — thin rings look generic.
- **Height** `h-40 sm:h-60 lg:h-56`. The chart is not the point; the figure in the middle of it is.
- **No glow, no drop-shadow.** Saturated colour on true black carries on its own, and glow changes
  the identity of the whole design.
- **Centre label**: small secondary caption above, headline figure below with the §3 decimal
  treatment. `pointer-events-none`.
- **No legend** — the breakdown list below *is* the legend, which is why chart and list must share
  one colour map.
- **Group slices below 5% into "Otros."** With rent at ~61% of the month, a raw pie is one huge arc
  plus a fringe of unreadable crumbs. The list below still shows every category; the grouping is a
  chart concern only.
- **Tooltip** styled with app tokens, never the library default, and pinned with `position={{ y: 0 }}`
  so it cannot collide with the centre label.
- **Animate once on mount** (700 ms, ease-out), skipped under reduced motion.
- **Suppress the focus ring.** Chart sectors are focusable SVG elements whose default outline reads
  as a stray white border around the card. No component code fixes this:

  ```css
  .recharts-wrapper *:focus,
  .recharts-wrapper *:focus-visible { outline: none; }
  ```

---

## 8. Stacking, containing blocks and overlays

**Structural, not aesthetic.** `filter`, `backdrop-filter`, `transform`, `will-change: transform`
and `contain` each make an element (a) the **containing block** for `position: fixed` descendants
and (b) a **stacking context** scoping its children's `z-index`.

- **An overlay inside a transformed ancestor is trapped in it**, not the viewport — including under
  a CSS entrance animation while it runs. → **Portal every modal, sheet and dialog to
  `document.body`.**
- **A dropdown inside such a container paints under the next card**, because its `z-index` only
  orders it *within* that container. → **Lift the container** (`sticky … z-30`) and comment that it
  is load-bearing; it looks decorative and gets deleted.

**Dropdown panels are `absolute`** relative to their own wrapper, never `fixed`. Overlay open/close
state lives in a store so any trigger can open one without prop-drilling.

Z-scale: `z-30` top bar · `z-40` dropdown panels and the profile sheet · `z-50` modals and
onboarding.

**Dropdowns that might not fit.** The category field sits near the bottom of the edit sheet, where a
downward panel would be clipped by the sheet's own scroll container. Measure available space **in
the click handler** — the trigger is already laid out, so there is nothing to wait for — and flip
upward with a capped `max-height`.

---

## 9. Motion

Quick and unshowy. Nothing bounces. And before anything else:

> ### No animation may decide whether content is visible.

Three failure modes, different mechanisms, same symptom — a blank or half-drawn page:

1. **A frame-driven entrance whose loop never starts.** The page sits at `opacity: 0` and 12px low
   until a scroll wakes it.
2. **A hidden document does not advance CSS animations either.** `fill-mode: backwards` claims the
   frames before an animation starts, so it holds content invisible for as long as the document
   stays hidden — a backgrounded tab, a preview pane, a restored session.
3. **An exit animation that never reports back leaves its subtree mounted** — an invisible,
   full-screen click trap over the page.

The rules that follow:

- **All entrances are CSS.** There is no animation library in this project.
- **No `animation-fill-mode`. No `animation-delay`.** Every keyframe ends at the element's own
  resting style, so an element that is never animated renders correctly, just unanimated.
- **Stagger via duration, never delay.** Section *n* takes `350ms + n × 110ms`. It looks the same
  and it cannot strand anything.
- **Overlays unmount instead of exit-animating.** A missing 160 ms fade-out beats a click trap.
- **Every timer, rAF and listener is cancelled in its cleanup**, and a cancelled animation resets.

`transition-delay` on a **transition** is fine, and is what the profile sheet's stagger uses: a
transition has no "before" frames to claim.

| Use                      | Treatment                                                                     |
| ------------------------ | ----------------------------------------------------------------------------- |
| Section entrance         | `rise-in`: fade + `translateY(12px → 0)`, `350ms + index × 110ms`, ease-out    |
| Modal / bottom sheet     | `sheet-in`: fade + `translateY(32px)`, `320ms cubic-bezier(.22,1,.36,1)`      |
| Centred dialog           | `dialog-in`: fade + `scale(.96)`, same curve                                  |
| Dropdown panel           | `pop-in-down` / `pop-in-up`: fade + `scale(.97)` + 4px, `160ms`               |
| Backdrop                 | `fade-in`, `180ms`                                                            |
| Inline control appearing | `reveal-inline`: `max-width 0 → 9rem` + fade, `160ms`                        |
| Accordion / expand       | `grid-template-rows: 0fr → 1fr`, `300–350ms ease-in-out`                     |
| Chevron rotate           | `rotate 0 → 180`, `250–350ms`                                                 |
| Progress bars, donut     | once on mount, `700ms ease-out`                                               |
| Week change              | content cross-fade `180ms` — **never a slide**; the arrows convey direction    |
| Corrected-row flash      | `bg-accent/15`, `500ms` transition, held `1400ms`                             |
| Profile sheet            | `translate-x` `300ms ease-out`; layers staggered `60ms`, items `45ms`        |
| Insight: analysing       | orb centred for 1200 ms, then travels `550ms cubic-bezier(.65,0,.35,1)`       |
| Insight: reveal          | sentence cross-fade `300ms` + one border sweep (§5.2)                        |
| Tap feedback             | `active:scale-90` / `active:scale-[0.97]`, `100ms`                            |

**Height animations use `grid-template-rows`, not `max-height`** — a real height transition with
nothing measured and no magic number guessed. Put `inert` on the collapsed content so it stays out
of the accessibility tree while still in the DOM.

**`prefers-reduced-motion` is honoured with one blanket rule** collapsing every animation and
transition to 0.01ms and disabling smooth scroll. Components consult the media query directly only
where the **decision** differs, not merely the duration — skipping the insight's analysing state
entirely, or scrolling instantly rather than smoothly.

---

## 10. Accessibility floor

- Every control is a real `<button>` / `<input>`, with an `aria-label` when its text is not
  self-describing.
- Dropdowns carry `aria-haspopup` / `aria-expanded` / `aria-controls`; their panel is
  `role="listbox"` with `role="option"` + `aria-selected` children.
- Dialogs use `role="dialog"` or `alertdialog` + `aria-modal` + `aria-labelledby`.
- **`Esc` closes every overlay, and focus returns to the trigger** — usually a small pencil button
  the user would otherwise have to hunt for again.
- Body scroll locks while a modal or the side sheet is open, restored to its previous value, not `''`.
- Decorative layers are `aria-hidden`; content that is present but collapsed is `inert`.
- The non-blocking onboarding uses `aria-modal="false"` and a `pointer-events: none` scrim,
  precisely because it must not trap anything.

**Contrast.** Secondary `#8e8e93` on `#1c1c1e` clears 4.5:1. Muted `#636366` does **not** — use it
only for genuinely tertiary content, never for a value the user must read.

**Never encode meaning in colour alone.** Category colours are decoration; flag badges always carry
text.

Accepted gap: the custom dropdown supports click / Tab / Enter / Esc but not arrow-key roving focus
— a deliberate trade for visual control over a native `<select>`.

**Copy.** Zero hardcoded strings, `aria-label` and `placeholder` included. Category names are data,
not copy, and are never translated. Marked-up interpolation uses `<Trans>` with a component map.
Detail notes say **what a flag did to the number** — "Posible duplicado" is trivia; "se cuenta una
sola vez en el total" is the reason the total does not match a naive sum.

---

## 11. Anti-patterns

Each produces a symptom that does not obviously point at its cause.

**Motion**

- **An animation that gates visibility.** All of §9; `fill-mode: backwards` plus a delay is the
  specific shape to look for.
- **An exit animation on a portaled overlay.** If the callback never fires you have an invisible
  full-screen click trap. Unmount instead.
- **A staged reveal on anything except the insight.** Delaying data the user already has is a lie
  everywhere else on this screen.
- **`setState` in an effect body to start an animation.** It costs a render on every mount and the
  hook lint rejects it. Initialise lazily, or flip inside a `requestAnimationFrame`.
- **`WEBGL_lose_context` in a cleanup.** Under StrictMode's mount→unmount→mount the second setup
  gets a dead context on the same canvas and paints it white.
- **A glow left lit at rest** because its animation was cancelled part-way. Reset in the cleanup.

**Colour and surface**

- **Glass or blur** anywhere except the scrolled top bar.
- **A second `shadow-*` on an element that already has one** — all `shadow-*` utilities target
  `box-shadow`, so one silently wins.
- **Painting every expense red.** The list turns red and the signal dies.
- **Glow on chart arcs**, or **a glow layer behind or inside a card** — it bleeds into the fill and
  reads as coloured haze rather than a lit edge. Light belongs in the ring (§5.2).
- **Tinted category discs at low alpha.** Opaque and saturated, or the list stops being scannable.

**Layout**

- **A `fixed` overlay inside a transformed ancestor** — trapped, not full-screen.
- **Trusting a panel's `z-index` inside a stacking context** — it only orders siblings within it.
- **Breakpoints on components inside a fixed-width column** — they fire on viewport width.
- **A dropdown opening downward near the bottom of a scroll container** — measure and flip.
- **Dividers between list rows.** Space separates them; lines add noise.
- **The decimal treatment on row amounts** — it breaks tabular alignment.
- **Spending phone pixels on chrome.** §6.1 is a budget and it is fully allocated.

---

## 12. Sources

Revolut iOS, via Mobbin — taken as **rules, not pixels**. Where a Revolut choice would hurt the
legibility of our figures, our figures win.

- [Spending analytics — donut by category](https://mobbin.com/screens/56d80261-ebab-49c4-aa2c-de9e23c41abb) — chart, centre label, category rows.
- [Spending analytics — custom period](https://mobbin.com/screens/6fb5bd20-f1f2-4ba8-8f7b-b8a410b2f852) — arc weight, headline figure with reduced decimals.
- [Budget](https://mobbin.com/screens/b578103d-3eca-4520-b50f-1698113428d7) — label/value rows grouped in a card.
- [Total wealth](https://mobbin.com/screens/5ba63fd5-6d4c-4149-a1d9-2ac6b6aec32d) — saturated icon discs, amount/percentage pairing.
- [Category transactions](https://mobbin.com/screens/b5fa1102-5e25-4bbc-b482-0d1c6aa6c692) — group header with a right-aligned aggregate.
- [Transactions list](https://mobbin.com/screens/d0e343a8-5e97-4b70-b94a-64ea9109e7b8) — pill search field, grouped rows.
- [Transaction detail](https://mobbin.com/screens/cfa1a923-8e97-4ffc-89ed-0ce688209a96) — sheet layout, big signed amount, blue interactive values.
