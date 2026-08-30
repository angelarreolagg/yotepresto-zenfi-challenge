# ROADMAP.md — Specification and build order

What this app must do, how it is structured, what the screen contains, and in what order to build
it. Every number and rule below is deliberate: where one looks arbitrary, it is load-bearing, and
the reason is stated beside it.

**Companions:** `STYLEGUIDE.md` (visual system), `CODESTYLE.md` (conventions), and `components/` —
five files to copy in verbatim, listed in `components/MANIFEST.md`.

Product and interface decisions are settled in §4 and §6. **Do not re-open them while coding.**

---

## 1. Goals

- **G1 — "Understand in ~10 seconds where the money went this month."**
  Test: someone opens the screen and, without scrolling or clicking, can name the top 2–3 spending
  categories and say whether the month closed positive or negative.
- **G2 — "Correct a miscategorized transaction."**
  Test: someone finds a wrong category, changes it, and sees the summary and chart update
  immediately — no save button, no reload.
- **G3 — First-run onboarding** (self-imposed). G1 explains itself the moment the screen renders.
  **G2 does not** — nothing about a table row announces that its category is editable. That is the
  only reason the tour exists, and it must never get in G1's way.

Graded on: real TypeScript, product judgement with stated reasons, **how the undefined parts of the
brief are handled**, and how it is explained. `DECISIONES.md` weighs as much as the code.
Not graded: backend, auth, coverage, feature count.

---

## 2. Data audit

61 records in `src/data/movimientos.json`, `periodo: "2026-08"`. No key is missing; the **values**
are what lie.

| Trap                          | Detail                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `monto` as a string           | 2 records (`txn_024` `"1876.40"`, `txn_048` `"2150.00"`), **unsigned, both expenses**. Naive `parseFloat` books **+4,026.40 of phantom income** — the highest-impact trap |
| Missing category              | `null` on 3, `""` on 1. One state, not two                                              |
| Missing account               | `null` on 1 (`txn_061`)                                                                 |
| Three months, not one         | `2025-11` (1 row, a flight 9 months early), `2026-08` (59), `2026-09` (1, scheduled)   |
| Four statuses, not two        | `confirmada` 56, `pendiente` 3, `programada` 1, `en_disputa` 1                          |
| Duplicates                    | 2 exact pairs (`txn_021`/`022` RAPPI −412; `txn_044`/`045` UBER −138). Same rule, two meanings |
| Foreign currency              | `txn_032` AWS is **USD** −12.00; the other 60 are MXN                                   |
| Rent dominates                | −48,500 = **~61% of spend**. A raw pie is one huge arc plus crumbs — the single most important design constraint here |
| Outflows that aren't spending | Card payment −5,000, ATM −3,000, 2× SPEI −3,500 = **11,500**                            |
| Refunds arrive positive       | `REEMBOLSO AMAZON MX` +1,899 exactly cancels a −1,899 purchase                          |
| Zero amount                   | `txn_036`                                                                                |
| Text hazards                  | Accents and emoji (`CAFÉ BRÚJULA — ALCALÁ ☕`), aggregator noise, a 62-char description |

**Seeded miscategorizations — the reason G2 exists:** `txn_005` DIDI → `Salud` (its siblings are
`Transporte`), `txn_009` FARMACIAS GUADALAJARA → `Entretenimiento` (the other pharmacy is `Salud`).

**Weekly distribution** (ISO weeks, clamped to the month), which is what motivates §6.5:
2026-08 → **8 · 21 · 22 · 8**; the other two months hold 1 row each.

**Naive totals are income 27,575.40 / expenses −97,542.75 / net −69,967.35** — absurd against an
18,450 salary. **With the §4 rules: income 21,650.00 / expenses 79,861.15 / net −58,211.15.**

---

## 3. Data contract

`movimientos.json` stays untouched. Its shape, **as it actually is**:

```ts
interface RawTransaction {
  id: string;
  fecha: string;           // ISO 8601 with a -06:00 offset
  descripcion: string;
  monto: number | string;  // string on 2 records, unsigned
  moneda: string;          // 'MXN' | 'USD'
  categoria: string | null;
  cuenta: string | null;
  estado: string;          // 4 values
}
interface RawTransactionFile { periodo: string; generado_en: string; movimientos: RawTransaction[] }
```

This is the only place `number | string` is tolerated; everything downstream consumes `Transaction`.

---

## 4. Product decisions (settled)

| Topic                             | Decision                                                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unsigned string amount            | Expense, unless the category is `Ingresos`. Flag the inference in metadata                                                                          |
| USD                               | Convert at a fixed, named constant `FX_USD_TO_MXN = 18.5`. Never sum mixed currencies                                                               |
| `null` vs `""` category           | One sentinel: `'Sin categoría'`                                                                                                                     |
| What counts as this month's spend | Exclude out-of-period, transfers (`Pagos`/`Efectivo`/`Transferencias`) and `en_disputa`. `pendiente` and `programada` **inside** the month do count |
| Refunds                           | Sum `amountMXN` **signed** per category; netting falls out for free                                                                                 |
| Duplicates                        | Flag both; exclude only the second from totals                                                                                                      |
| Chart vs list                     | The chart groups **< 5% into "Otros"**. The list shows **every** category (top 3 + expand)                                                          |
| List scope                        | Strictly the selected month, and within it **one week at a time** (§6.5)                                                                            |
| List length                       | No cap inside a week. From `lg` the list scrolls inside its own card, ~6 rows                                                                       |
| Category editing                  | In a **modal**, not inline: it makes room for the technical detail panel                                                                            |
| Persistence                       | `localStorage`, **decisions only** (overrides, period, profile, language). Never the normalized array. Re-validate everything read back             |
| Reset                             | Confirmation dialog + working state. Keeps the language                                                                                             |
| Month selector                    | Yes. Changing month must **not** discard corrections                                                                                                |
| Languages                         | Spanish and English from the start, via i18n. Spanish is default and fallback. Zero hardcoded copy                                                  |
| Formatting                        | Follows the active language (`es-MX` / `en-US`). **Currency stays MXN** — it's the data, not a preference                                           |
| Profiles                          | Three static demo profiles. Chrome, not data: the dataset is identical for each                                                                     |
| Analytics                         | **Out of scope.** Added afterwards by the PostHog wizard — §11                                                                                      |

**Visual identity** lives in `STYLEGUIDE.md`, derived from Revolut's iOS app. Two consequences that
change what you build: **there is no glass and no animated background**, and **expenses render in
white, not red** — painting every row red destroys the signal in a list that is almost entirely
expenses.

---

## 5. Architecture

### 5.1 Three layers

| Layer             | Runs            | Rule                                                      |
| ----------------- | --------------- | --------------------------------------------------------- |
| **Normalization** | Once, at load   | Produces `Transaction` with every `metadata` flag resolved |
| **Derivation**    | Pure, on demand | No React, no store, no i18n. Lint-enforced                 |
| **Presentation**  | On render       | Branches on flags. **Never re-applies a business rule**    |

If a component asks "does this count as spend?", the answer belongs in layer 1 or 2.

### 5.2 Stack

Vite + React 19 + TypeScript strict · Tailwind v4 (`@theme`, no config file) · Zustand (flat, no
middleware) · Recharts (one donut) · lucide-react · i18next + react-i18next · country-flag-icons ·
Vitest (`environment: 'node'`).

**No animation library**, and no `clsx`/`tailwind-merge` — `shared/lib/cn.ts` is six lines.

### 5.3 The animation constraint

> **No animation may decide whether content is visible.**

Three failure modes make this non-negotiable. A frame-driven entrance whose loop never starts leaves
the page at `opacity: 0` until a scroll wakes it. A hidden document does not advance CSS animations
either, so `fill-mode: backwards` holds content invisible for as long as it stays hidden — a
backgrounded tab, a preview pane, a restored session. And an exit animation that never reports back
leaves its subtree mounted as an invisible, full-screen click trap.

Therefore, everywhere:

- **Entrances are CSS keyframes with no `fill-mode` and no `animation-delay`.** Every keyframe ends
  at the element's resting style, so an unplayed animation still renders correctly.
- **Stagger by duration, never by delay** (section *n* takes `350ms + n × 110ms`).
- **Overlays unmount instead of exit-animating.** A lost 160 ms fade-out beats a click trap.
- **Every timer, rAF and listener is cancelled in its cleanup**, and a cancelled animation resets.

### 5.4 File tree

```
src/
  app/
    main.tsx                        # initI18n(persisted) BEFORE createRoot
    App.tsx  index.css              # index.css ← components/
    providers/AppProviders.tsx      # where portaled overlays mount
    ui/                             # TopBar, Logo, PeriodPicker, UserSwitcher,
                                    # LanguageSwitcher, ResetConfirmDialog,
                                    # pageContainer.ts, ProfileMenu ← components/
  features/                         # NEVER import each other
    expense-breakdown/  index.ts
      ui/                           # BreakdownSection, ExpenseChart,
                                    # CategoryBreakdownList, InsightLine, SummaryStrip
      lib/                          # categoryBreakdown.ts, insight.ts
    transaction-list/   index.ts
      ui/                           # TransactionList, TransactionFilters, WeekNavigator,
                                    # TransactionRow, TransactionDetails, EditCategoryModal
      model/editCategoryOverlay.ts
      lib/                          # filters.ts, weeks.ts
    onboarding/         index.ts
      ui/OnboardingOverlay.tsx   model/onboardingStore.ts
  entities/transaction/ index.ts    # THE public API of the domain
      api/                          # raw.ts, dataset.ts (the one cast)
      model/                        # types.ts, normalize.ts, store.ts, persistence.ts
      lib/                          # periods.ts, eligibility.ts, summary.ts
      ui/                           # categoryTheme.ts, CategoryIcon, Amount, FlagBadges
  shared/
      ui/                           # Modal, FadeIn, LanguageFlag, useReducedMotion, useScrolled
                                    # Dropdown, Orb, BorderGlow ← components/
      lib/                          # format.ts, money.ts, cn.ts, safeStorage.ts
      overlay/createOverlayStore.ts
      i18n/                         # index.ts, languages.ts, useLocale.ts, locales/{es,en}.json
      config/users.ts
  data/movimientos.json
```

Three placements that are easy to get wrong:

- **The edit modal lives inside `transaction-list`**, not as its own feature — otherwise the row
  would have to import its store to open it, which is a cross-feature import.
- **The selected user lives in the transaction store**, not an `entities/user`. It is a *scope over
  the dataset*, exactly like `selectedPeriod`; the static names and colours go in `shared/config/`.
- **`PeriodPicker`, `UserSwitcher`, `SummaryStrip` are not features.** A feature is a capability
  **with its own state or derivation**; without that filter you get twelve one-component slices.

### 5.5 Logic contracts

Build these before any UI. All pure, all directly testable.

**`model/types.ts`** — 16 categories `as const` → `KnownCategory`; `UNCATEGORIZED = 'Sin categoría'`;
`Category = KnownCategory | typeof UNCATEGORIZED`. Plus `TRANSFER_CATEGORIES` (`Pagos`, `Efectivo`,
`Transferencias`), `INCOME_CATEGORY = 'Ingresos'`, the four statuses, and `is*` type guards.

```ts
interface TransactionMetadata {
  isUncategorized: boolean;    // category was null or ''
  isDuplicate: boolean;        // both copies get it
  isExtraDuplicate: boolean;   // only the second; the only one excluded from totals
  isPendingOrDisputed: boolean;
  isOutOfPeriod: boolean;      // flipped by applyPeriod, not by the record
  isForeignCurrency: boolean;
  isTransfer: boolean;
  isRefund: boolean;           // positive amount inside an expense category
  isZeroAmount: boolean;
  hadInferredSign: boolean;
  amountMXN: number;           // the ONLY figure any total may sum
}

interface Transaction {
  id; description;
  date: Date;                  // ordering only, never display
  dateKey: string;             // 'YYYY-MM-DD', read from the ISO string
  periodKey: string;           // 'YYYY-MM', same source
  amount: number;              // signed, in `currency`
  currency: string;
  category: Category;
  account: string;             // '' when the aggregator sent none
  status: TransactionStatus;
  metadata: TransactionMetadata;
}
```

**`model/normalize.ts`** — `FX_USD_TO_MXN = 18.5`, `normalize`, `normalizeAll`, `withCategory`.

- **Calendar keys come from the ISO string via regex**, never from `Date`'s local getters — those
  shift across midnight whenever the viewer's timezone differs from the `-06:00` in the data,
  silently moving rows between days, weeks and months.
- **Sign inference**: string + unsigned + positive + not `Ingresos` → negate, set `hadInferredSign`.
- **Duplicates need the whole array**, so `normalizeAll` resolves them. Key:
  `description|amount|date.getTime()`.
- **`withCategory` recomputes** `isUncategorized`, `isTransfer`, `isRefund` — a correction changes
  all three. Returns the same object when nothing changed.

**`lib/eligibility.ts`** — `isSpendEligible` applies the four §4 exclusions; `getTransactionKind`
returns `'gasto' | 'ingreso' | 'traspaso'`. **Refunds count as `gasto`**: they net against their
category, so calling them income would inflate both sides of the summary at once.

**`lib/summary.ts`** — `computeSummary(transactions): { totalIncome, totalExpenses, netFlow }`.
The first two are positive magnitudes; `netFlow` is signed. Used by **both** the monthly strip and
the weekly navigator — two implementations would put contradictory numbers on one screen.

**`lib/periods.ts`** — `applyPeriod`, `listPeriods`, `scopeToPeriod`. `applyPeriod` **re-scopes by
flipping one flag**; rebuilding from raw JSON would discard the user's corrections on every month
switch. Unchanged records are returned by reference so React can skip them.

**`model/persistence.ts`** — `STORAGE_KEY = 'zenfi.decisions.v1'` and `parsePersistedState(stored:
string | null)`, **pure** so it is testable without a DOM. It must survive corrupt JSON, wrong types
and enum values that no longer exist. Unknown categories are **dropped, not coerced**.

**`expense-breakdown/lib/categoryBreakdown.ts`** — `computeCategoryBreakdown` sums `amountMXN`
**signed** per category and drops anything not positive, so refund netting comes free.
`groupSmallSlicesAsOthers(breakdown, threshold = 5)` builds the chart's slices.

**`expense-breakdown/lib/insight.ts`** — `computeInsight` returns **a translation key plus raw
values, never a sentence**: `lib/` cannot import i18n, and a function that builds text can only ever
speak one language. Above `FIXED_COST_THRESHOLD_PERCENT = 40` it switches to the variant naming the
biggest *variable* expense — "rent is 61% of your month" is true but not actionable.

**`transaction-list/lib/filters.ts`** — `applyFilters` ANDs kind + category + account + search.
Search **folds accents** (NFD, strip combining marks) and requires **every word to match in any
order** across description + category + account. That is what makes "oxxo canteras" and "canteras
oxxo" behave the same, and lets someone type "comida" without knowing merchant names.

**`transaction-list/lib/weeks.ts`** — `listWeeksInPeriod`, `scopeToWeek`, `summarizeWeek` (which
delegates to `computeSummary`). All date maths in **UTC on the calendar keys**, so no timezone
shifts a boundary. Weeks are bounded **by the data, not the calendar** — August holds rows to the
19th, so generating the trailing empty calendar weeks would give the `›` button somewhere pointless
to go. Empty weeks *between* populated ones are kept, or the arrows jump unpredictably.

**`shared/lib/money.ts`** — `toCents`, which also collapses `-0`. Without it, float sums put
`79861.150000000001` on screen and `-0` reaches the formatter as `−$0.00`.

### 5.6 The store

Flat Zustand, no middleware. State: `transactions`, `availablePeriods`, `selectedPeriod`,
`currentUser`, `language`, `categoryOverrides`. Actions: `updateCategory`, `setPeriod`, `setUser`,
`setLanguage`, `resetToOriginal` — each persisting the four decisions.

- **Initial state re-applies stored overrides** through `withCategory`, and falls back when a
  persisted period or user no longer exists rather than leaving the screen empty.
- **`resetToOriginal` deliberately keeps the language.** Flipping the UI to another language
  mid-dialog is not what "restablecer los cambios" promises.
- **Never build a derived array inside a selector** — a new array every render is an infinite loop.
  Derive with `useMemo` in the component.

---

## 6. Interface

One screen. One column on a phone, two from `lg`:

```
grid-cols-1  lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]  lg:items-start
gap-3 sm:gap-6 lg:gap-8
```

The reading order **is** the argument — shape, then the conclusion, then the figures, then the rows
behind them. On a phone that can only be vertical; on a wide screen the answer stays left while the
evidence scrolls right, and nobody scrolls past a 700px card to reach the list.

Page width is decided in **one** place, `app/ui/pageContainer.ts`, shared by the sticky bar and the
content so their left edges cannot drift:

```
mx-auto w-full max-w-md px-4 sm:max-w-2xl sm:px-6 md:max-w-3xl lg:max-w-6xl lg:px-8 xl:max-w-7xl
```

**The mobile first screen is a budget.** At 390×844, before scrolling, the user must see the whole
donut and its figure, the insight, the top 3 categories, income, net, and the first rows of the most
recent week. Every mobile-only reduction below exists to pay for that.

### 6.1 TopBar

One shell holding two rows — the shared surface is what keeps the small label text legible.

```
sticky top-0 z-30 transition-colors duration-200
  at top:    border-b border-transparent  bg-surface
  scrolled:  border-b border-border/70    bg-surface/75 backdrop-blur-xl   (useScrolled, 8px)
```

**`z-30` is load-bearing**: without it the dropdown panels this bar hosts are ordered only within
its own stacking context and paint under the first card. The blur is the one sanctioned departure
from STYLEGUIDE §5, safe only because it is contained — everything below stays solid, and every
overlay is portaled.

**Row 1** (`h-11 sm:h-14`): logo left; right, the greeting plus

| Viewport | Right side                                                                            |
| -------- | ------------------------------------------------------------------------------------- |
| `< sm`   | `"Hola, {nombre}"` + an avatar disc (initial, profile colour) that opens `ProfileMenu` |
| `≥ sm`   | `"Hola,"` + `UserSwitcher` dropdown + `LanguageSwitcher` pills with flags              |

The greeting stays at every size — it is the one thing in the bar addressed to the person using it.
Avatar colours come from `shared/config/users.ts` and are **deliberately not the accent**, which
means "interactive" everywhere else. A 1px `bg-border` hairline separates the rows.

**Row 2** (`py-1.5 sm:py-3`): the `PeriodPicker` as a `title`-variant dropdown, with an uppercase
`PERIODO` label above it **from `sm` only** — the bar is permanently on screen and "Agosto de 2026"
needs no label. Right: two icon buttons, reset and help (restarts the tour).

### 6.2 ProfileMenu — phone only

Right-hand side sheet at **half the viewport width**, portaled, `z-40`.
→ **`components/ProfileMenu.tsx`**

Two coloured prelayers slide in behind the panel 60 ms apart, then the panel; items follow, 45 ms
each. **Layers lead on the way in and trail on the way out** — that reversal is the effect. It
**stays mounted and slides on `translate-x`** rather than unmounting, which is what gives it a real
exit; closed, it is `inert`. The stagger is CSS `transition-delay`, which unlike an
`animation-delay` cannot strand anything half-applied.

Contents: the current profile as a heading, a `PERFIL` section (three profiles, two-digit index,
check on the active one) and an `IDIOMA` section with flags. Body scroll locks; `Esc` closes.

### 6.3 Month analysis card (G1)

`rounded-2xl bg-surface p-3 sm:p-4`, `flex flex-col gap-2.5 sm:gap-3`:

**a. Donut** — `h-40 sm:h-60 lg:h-56`. Recharts, `innerRadius 62%` / `outerRadius 92%` /
`paddingAngle 2` / `cornerRadius 4` / `stroke="none"`, animating once on mount (700 ms) unless
reduced motion. Five slices after the 5% grouping.

Centre label, absolute and `pointer-events-none`: `Gasto total` above the compact figure at
`text-[1.4rem] sm:text-[2.1rem] lg:text-[1.6rem] font-bold tracking-tight`, **fraction at
`text-[0.6em]`**. The `lg` size is smaller than `sm` on purpose — in two columns the card is
narrower and the chart must not dominate a column it shares with the whole category list.

The tooltip is app-styled and pinned (`position={{ y: 0 }}`) so it cannot collide with the figure.
The wrapper is `aria-hidden`; the list below is the accessible version.

**b. Insight** — §6.4.

**c. Category list** — **every** category, not just the charted ones. The 5% grouping keeps the
donut readable; applying it here too would mean the screen never says where 8% of the money went.

Top **3** always visible; the rest stay mounted inside a wrapper animating `grid-template-rows`
`0fr → 1fr` — a real height transition with nothing measured — and `inert` while collapsed. Each
row: 40px saturated disc · name · amount · a 4px bar in the category colour · percentage. **Bars
grow from 0 on mount**, with the state flipped inside a `requestAnimationFrame`.

**d. Summary strip** — two columns, `divide-x` over a `border-t`: **Ingresos** and **Neto**.
Expenses are deliberately absent — the figure is already the largest thing on screen, and repeating
it would dilute it. It sits **inside** the analysis card: the three headline figures belong
together, and a separate card cost 80px of the phone's first screen to say two numbers.

Empty state: the message plus the summary strip, no chart.

### 6.4 The insight card

```
BorderGlow(animated = revealed && !reducedMotion, borderRadius 12, backgroundColor "#141416",
           colors ['#9160dc','#7030cf','#0a84ff'], glowColor "265 62 67",
           glowRadius 22, glowIntensity 0.85, coneSpread 22, fillOpacity 0.45)
  └── div.insight-body[data-revealed]   relative p-2.5 sm:p-3
        ├── <p>       the sentence — pl-11 sm:pl-13 pr-7, text-xs sm:text-sm
        ├── <button>  re-run — absolute top-1.5 right-1.5, RotateCcw 13px
        └── div.insight-orb   Orb + "Analizando tus movimientos..."
```

→ **`components/Orb.tsx`**, **`components/BorderGlow.tsx`**, and the `.insight-orb` rules already in
**`components/index.css`**.

**The sequence.** `revealed` starts `false` (or `true` under reduced motion). For `ANALYSING_MS =
1200` the orb sits centred with its label; then the sentence fades in, the orb travels to the left
edge and settles across **both lines**, the label fades out, and the border sweeps once. 1200 ms is
long enough to read as a conclusion being drawn and short enough not to read as lag; past ~1.5 s it
stops feeling like thinking and starts feeling like a slow page.

**The sentence is in the layout from the first frame**, at `opacity: 0`. It is what gives the card
its height, so nothing below moves when the analysis resolves — and the orb, absolutely positioned,
can travel without affecting anything.

**The travel is CSS.** `.insight-orb` is centred; `.insight-body[data-revealed='true'] .insight-orb`
sets `left: 0.625rem` (`0.75rem` from `sm`) with `translate(0,-50%)`. Both `left` and `transform`
interpolate, so it is a real move. **Vertically it never moves** — that is what lets it span two
lines. The resting inset matches the card's padding, because `left: 0` is the padding box's origin
and would sit flush against the border.

**The re-run button matters more than it looks.** A correction changes the breakdown and therefore
this sentence; without it, the one moment that reads as *thinking* would only ever happen on load,
before the reader had changed anything. It sets `revealed` back to `false`, re-running everything
including the sweep.

Emphasise the amounts with `<Trans>` and an `<amount>` component (`font-semibold tabular-nums`), so
the markup lives in the catalogue and a translator can move it.

Both components carry docblocks explaining their non-obvious parts — including why `Orb` must
**not** call `WEBGL_lose_context` in cleanup, and why `BorderGlow`'s cleanup must reset. Do not
"simplify" either.

### 6.5 Transaction list card (G2)

`rounded-2xl bg-surface p-3 sm:p-4`, `flex flex-col gap-2.5 sm:gap-4`.

**Title** — `sr-only` on a phone, visible from `sm`. Still announced; just not spending 36px on a
title the search field and week navigator already make obvious.

**Search + filters.** A full-width pill search field, and beside it **on a phone only** a filter
toggle carrying a count badge. → **`components/Dropdown.tsx`** for all three filters.

- `< sm`: the three dropdowns collapse behind the toggle. They cost ~90px far better spent on
  transactions, and search is what people reach for first; the badge keeps an active filter visible.
- `≥ sm`: all three side by side in one row (`sm:flex`, each `sm:min-w-0 sm:flex-1`); stacked they
  are a 2-column grid with the account filter spanning both.

Every dropdown carries an explicit "all" option — a filter you can set but not unset in the same
place is the classic dead end. Category and account options show a **result count**. A "Limpiar"
button appears only when there is something to clear, growing in via `max-width`.

**Any active filter suspends the weekly view** and searches the whole month, with a line saying so.
Filtering is a search action, not a navigation one: restricting it to the visible week would return
nothing for rows that plainly exist.

**Week navigator** — `rounded-xl bg-surface-sunken`, two arrows with everything between them in two
lines: the day range and row count, then income and expenses. All of it sits between the arrows
rather than in its own block, which cost ~27px to say nothing new. Arrows stop at the month's edges.
The default week is the most recent, **derived** rather than reset by an effect, so a choice made
for another month simply stops applying.

**Rows**, newest first, keyed on the week so content **cross-fades**; never a slide — the arrows
already convey direction and a sliding list re-reads as a carousel. From `lg`:
`lg:max-h-[25.5rem] lg:overflow-y-auto` with `.scroll-slim`, ~6 rows, so both cards are fully on
screen with no page scroll.

Each row: disc · description + `date · category · status` · the **MXN** amount (so the column adds
up to the totals above) · a pencil button; `FlagBadges` below, indented to the text.
`isPendingOrDisputed` → `opacity-60`; `isUncategorized` → `bg-warning/5`; the just-corrected row →
`bg-accent/15` for 1400 ms, **fired when the modal closes** — flashing behind the dialog is flashing
where nobody sees it.

Three distinct empty messages: no rows in the period, nothing matched, nothing this week.

### 6.6 Edit modal (G2)

A modal, not an inline select: inline is fewer clicks but leaves nowhere to explain *why* a row is
flagged, and those flags are half of what makes this dataset interesting. Bottom sheet on a phone,
centred from `sm`.

Title + close · the transaction on a `surface-raised` block · **`TransactionDetails`** · the
category dropdown (`field` variant) · a full-width accent "Guardar cambios".

`TransactionDetails` is a collapsed `surface-sunken` panel with a warning count, holding a recap, a
`status / reference / statement` list, and one note per flag. **Every note says what the flag did to
the number**: "Posible duplicado" alone is trivia; "se cuenta una sola vez en el total" is the
reason the figure above does not match a naive sum.

**The correction applies the moment a category is picked**; the button only closes. No pending state
to lose, no save button to forget. The transaction is looked up **live from the store** by id, not
held in the overlay payload, so it carries the correction just made.

### 6.7 Onboarding (G3)

Three steps anchored to real elements via `data-onboarding`: the breakdown card, **the edit button**,
the week navigator. If only one survived a cut it would be the second — it is why the tour exists.

**Non-blocking**: the dim layer is `pointer-events: none`, so the dashboard stays usable and the
tour can never be something the user must dismiss first. A 2px accent ring traces the anchor.

**Placement**: below the anchor, else above, **else pinned to the bottom edge**. The third branch is
what the analysis card needs on a phone — it is taller than the viewport, and anchoring to the top
would bury the header.

**Measurement**: scroll the anchor into view smoothly and re-measure on every scroll and resize so
the card travels *with* it. First measurement in a `requestAnimationFrame`, **plus a 100 ms poll for
800 ms** — smooth scrolling is frame-driven, and a throttled or backgrounded tab can defer both the
frame and the events, leaving the card floating mid-screen.

Seen-state is versioned `localStorage`. The help button **restarts without clearing the flag**.

### 6.8 Reset dialog

`alertdialog`, centred. Confirming shows a spinner for **550 ms** before applying: the reset is
instant, but a destructive action that completes with no acknowledgement reads as "nothing
happened", and the locked window makes a double-submit impossible. `Esc` and the backdrop are
disabled while it works.

### 6.9 Edge cases

| Case                         | Behaviour                                            |
| ---------------------------- | ---------------------------------------------------- |
| Month with no eligible spend | Empty message + the summary strip, no chart          |
| Week with no rows            | "Sin movimientos esta semana", arrows still work     |
| Search matches nothing       | "Nada coincide", clear button present                |
| `localStorage` unavailable   | Everything works, nothing is remembered              |
| Corrupt persisted payload    | Falls back to defaults, field by field               |
| Persisted period/user gone   | Falls back to the file's period / the default user   |
| Zero-amount row              | Listed with a note; contributes nothing              |
| No account on a record       | "Sin cuenta" as its own sentence, never interpolated |

---

## 7. Acceptance criteria

| Check                              | Expected                                               |
| ---------------------------------- | ------------------------------------------------------ |
| Income / expenses / net (Aug 2026) | **21,650.00 / 79,861.15 / −58,211.15**                 |
| Categories in the breakdown        | **11**                                                 |
| Chart slices (5% threshold)        | **5** (Vivienda, Supermercado, Compras, Comida, Otros) |
| Rows, no filters — August 2026     | **59** across **4** weeks: 8 · 21 · 22 · 8             |
| Rows — Nov 2025 / Sep 2026         | **1** each, single week                                |
| Available periods                  | `['2025-11', '2026-08', '2026-09']`                    |
| Sum of the four weekly summaries   | equals the monthly summary                             |

A net of **−69,967.35** means naive sums: the exclusions are not applied and refunds are not netted.

**Sanity-dump technique.** Write a temporary test that prints these numbers, run it with
`--reporter=verbose`, compare, then **delete the file**. Anything worth asserting gets promoted to a
real regression test.

---

## 8. Build order

Each phase closes with `typecheck` / `lint` / `test` / `build` green, in one commit.

**0 — Foundations.** Vite + React + TS. Deps: `zustand recharts lucide-react i18next react-i18next
i18next-browser-languagedetector country-flag-icons`; dev: `tailwindcss @tailwindcss/vite prettier
vitest husky lint-staged @types/node`.

The `@` → `src` alias and `test: { include: ['src/**/*.test.ts'], environment: 'node' }` in
`vite.config.ts`; the strict flags from CODESTYLE §5 in `tsconfig.app.json`. **Copy
`components/index.css` to `src/app/index.css`** — tokens, keyframes, orb CSS, scrollbar, all of it.
Add the ESLint config from CODESTYLE §3.6 and the two Husky hooks **now**, not later. Create the
whole §5.4 tree in one pass.

**1 — i18n.** `shared/i18n/`, with `initI18n` running in `main.tsx` **before `createRoot`** so no
component ever paints a fallback key. The catalogue-parity test lands here.

**2 — Domain.** `raw.ts`, `dataset.ts`, `types.ts`, `normalize.ts`, `persistence.ts` + tests. **One
test per quirk in §2.**

**3 — Rules and store.** `eligibility.ts`, `summary.ts`, `periods.ts`, `store.ts`, the barrel.
Verify §7's numbers before building any UI on them.

**4 — Month analysis (G1).** `format.ts`, `categoryTheme.ts`, `CategoryIcon`, `Amount`, then
`categoryBreakdown.ts`, `insight.ts` and the breakdown UI. The screen now answers G1.

**5 — List and correction (G2).** `filters.ts`, `weeks.ts`, `Modal`, `createOverlayStore`,
**`components/Dropdown.tsx`**, then the list, rows, filters, navigator, detail panel and modal. The
screen now answers G2.

**6 — Shell.** `TopBar`, `PeriodPicker`, `UserSwitcher`, `LanguageSwitcher`, `pageContainer.ts`,
`useScrolled`, `ResetConfirmDialog`, the two-column `App`, and **`components/ProfileMenu.tsx`**.

**7 — Onboarding (G3).** Store + overlay + the three `data-onboarding` anchors, mounted in
`AppProviders` rather than inside a feature.

**8 — Visual identity.** Apply STYLEGUIDE in full. **Read its §9 before writing a single
animation** — §5.3 here is not obvious from the outside.

**9 — Orb and lit border.** **`components/Orb.tsx`** and **`components/BorderGlow.tsx`** verbatim,
plus the §6.4 staging. Last of the visual work, deliberately: it is the only ornamental object in
the app and belongs on a screen that is already correct without it.

**10 — Mobile pass.** Measure at 390×844 against the §6 budget. Do not guess.

**11 — Delivery.** `DECISIONES.md` and `README.md` — §10.

---

## 9. Definition of done

- [ ] `typecheck`, `lint`, `test`, `build` all green.
- [ ] Zero `any`. One `as` at the JSON boundary, plus the three style-object widenings in
      `BorderGlow` — each commented.
- [ ] Every §7 number verified against the real dataset.
- [ ] Zero hardcoded user-facing strings, `aria-label` and `placeholder` included; both catalogues
      in sync, with a test proving it.
- [ ] **Reload three times on a phone viewport** and confirm content is correct on the first frame
      every time. This is §5.3, and the single easiest thing to break.
- [ ] Every overlay closes on `Esc` and returns focus to its trigger.
- [ ] `prefers-reduced-motion` honoured: no analysing state, no sweep, no smooth scroll.
- [ ] A correction updates donut, breakdown, summary and row with no reload, and survives a month
      switch and a page reload.
- [ ] Reset restores the original data and keeps the language.
- [ ] The onboarding card is fully on screen at 390×844 on all three steps.

---

## 10. Delivery documents

**`DECISIONES.md`** — Spanish, **max one page**. It weighs as much as the code, so it is an
argument, not a changelog: what was interpreted and why, what was deliberately left out and what it
would have cost, the trade-offs where a defensible alternative lost, and what comes next. The
interesting content is the `isSpendEligible` exclusions, modal-over-inline, shipping onboarding at
all, and the §5.3 animation constraint.

**`README.md`** — Spanish. How to run it, the stack, the architecture in five lines, the scripts,
and a pointer to `DECISIONES.md`.

---

## 11. Analytics — PostHog (not built here)

**Do not implement analytics.** No `posthog-js`, no `shared/analytics/`, no `capture()` calls. It is
wired in afterwards with the **PostHog setup wizard**, which adds the provider and key itself;
anything hand-rolled first is only something the wizard has to undo.

Leave two things in place for it: `posthog-js` stays in the `lib/` purity rule's banned list, which
keeps analytics out of the derivation layer; and the key belongs in `VITE_POSTHOG_KEY` in a
git-ignored `.env.local`, with a documented `.env.example`.

Events worth adding by hand once the wizard has run — autocapture cannot tell you whether someone
*understood* the month or *corrected* anything:

| Event                                                       | Properties                                          |
| ----------------------------------------------------------- | --------------------------------------------------- |
| `category_corrected` — **the important one, it measures G2** | `from_category`, `to_category`, `was_uncategorized` |
| `insight_reanalysed`                                        | `after_correction`                                  |
| `week_navigated`                                            | `direction`, `week_key`, `row_count`                |
| `search_used`                                               | `term_length`, `results_count` (0 flags a failure)  |
| `filter_applied`                                            | `dimension`, `value`                                |
| `onboarding_step_viewed` / `_completed` / `_skipped`        | `step`, `at_step`                                   |
| `period_changed`, `language_changed`, `reset_confirmed`     | `from`, `to`                                        |

Session recording should mask inputs and mark amounts `data-private`. The data is fictional, but on
a financial screen the correct configuration should be visible.
