# CODESTYLE.md — Code conventions

Conventions for this repository. Every rule is concrete and enforceable, and several exist to head
off failure modes that are cheap to prevent and expensive to diagnose.

---

## 1. Language

- **Code is English.** Variables, functions, components, types, files, comments, commit messages.
- **The UI ships in Spanish and English**, through i18n (§2). Spanish is default and fallback.
- **Delivery docs are Spanish** (`README.md`, `DECISIONES.md`); **internal docs are English**.

A Spanish identifier reads as a mistake. So does a hardcoded label of any language.

---

## 2. Internationalisation

**No user-facing string is ever written in a component** — including `aria-label`, `title`,
`placeholder`, `alt` and empty-state copy, the ones that get forgotten first.

```tsx
// ❌
<button aria-label="Editar movimiento">Guardar cambios</button>
// ✅
<button aria-label={t('transactionList.row.edit')}>{t('editCategory.save')}</button>
```

- **Keys are English and describe the slot, not the sentence.** `transactionList.empty.filtered`,
  not `noHayMovimientosQueCoincidan`. Rewording copy must never mean renaming a key.
- **One catalogue per language**, `shared/i18n/locales/{es,en}.json`, with a **mandatory key prefix
  matching the slice that owns the string** — `expenseBreakdown.*`, `transactionList.*`,
  `editCategory.*`, `onboarding.*`, plus `app.*` for shell chrome. Colocation and greppability
  without namespace-registration plumbing.
- **Both catalogues stay in sync.** A key exists in both or in neither; a three-line test asserting
  identical key sets catches the string forgotten mid-feature.
- **Interpolation and plurals**, never concatenation: `t('transactionList.week.count', { count })`,
  with `_one` / `_other` for English.
- **Marked-up interpolation uses `<Trans>`**, with the markup declared in the catalogue, so a
  translator can move the emphasis to wherever the figure lands:

  ```tsx
  <Trans i18nKey={insight.key} values={values}
         components={{ amount: <span className="font-semibold tabular-nums" /> }} />
  ```

- **Domain values are not translated.** Category names are data and members of the `Category` union;
  translating them would break the model, the filters and the persisted overrides.
- **Formatting follows the active locale.** `Intl` receives the current locale, never a hardcoded
  `'es-MX'`. **Currency stays MXN in every language** — it is the data, not a preference.
- **`i18n.language` can carry a region** (`en-US`, `es-419`). Resolve to a base tag **once**, in
  `shared/i18n/languages.ts`, rather than making every caller remember the region exists.

---

## 3. Architecture

Organised **by feature, not by artefact type**: a feature owns its components, stores, hooks and
pure logic, so working on one means opening one directory instead of four.

### 3.1 The tree

Create it on day one, in one pass — deliberating per file is what produces `lib/utils.ts`,
`lib/helpers.ts` and `lib/transactionUtils.ts` in the same session. Full tree in `ROADMAP.md` §5.4:

```
src/
  app/        Composition and shell. May import from anything.
  features/   User capabilities. NEVER import each other.
  entities/   The shared domain. Only imports from shared.
  shared/     Generic. Zero domain knowledge. Imports from nobody.
  data/       movimientos.json, untouched.
```

### 3.2 The dependency rule

```
app  →  features  →  entities  →  shared
```

Downward only. **Never sideways** (`feature → feature`, `entity → entity`), never upward, always
through the slice's public API. Because a feature cannot import from another feature, the only way
to share is to move down — the architecture forces the right answer instead of relying on anyone
remembering it.

### 3.3 Where does this go?

| What you are writing                                               | Where it goes                                      |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| A domain type or a `metadata` flag                                 | `entities/transaction/model/types.ts`              |
| A rule that decides a flag at normalization time                   | `entities/transaction/model/normalize.ts`          |
| A pure function used by ≥2 features                                | `entities/transaction/lib/`                        |
| A pure function used by exactly 1 feature                          | `features/<slice>/lib/`                            |
| A component rendering domain data, used by ≥2 features             | `entities/transaction/ui/`                         |
| A component belonging to one feature                               | `features/<slice>/ui/`                             |
| A component with no domain knowledge                               | `shared/ui/`                                       |
| Shared business state                                              | `entities/transaction/model/store.ts`              |
| Overlay open/close state                                           | `features/<slice>/model/` via `createOverlayStore` |
| Ephemeral control state (hover, accordion open, unconfirmed input) | `useState`, in the component                       |
| Screen composition, shell, or a header control                     | `app/`                                             |

**The rule of two.** A pure function moves up to `entities/` **at the moment** a second feature
needs it, not before. Count consumers; do not judge.

### 3.4 The three layers, made physical

| Layer          | Where                                     | What characterises it                                       |
| -------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Normalization  | `entities/transaction/model/normalize.ts` | Runs once, resolves every `metadata` flag. Single source of truth |
| Derivation     | any `*/lib/*.ts`                          | Pure. No React, no store, no i18n. Testable without mounting  |
| Presentation   | any `*/ui/*.tsx`                          | Branches on flags. **Never re-applies a business rule**       |

### 3.5 Hard rules

1. **Relative inside a slice, alias between slices.** `../lib/weeks` within;
   `@/entities/transaction` across.
2. **Never import your own barrel from inside the slice.** This one rule removes the entire class of
   cycles that makes barrels painful.
3. **Nothing loose at a slice root** except `index.ts`. Segment names are fixed — `api/`, `model/`,
   `lib/`, `ui/`; a directory appears only when it has content, but its name is never invented.
4. **`shared/` has no barrel.** Import by deep path. A barrel there would drag Recharts into any
   module that only wanted `cn()`.
5. **A barrel exports only what something outside the slice consumes.** One that lists everything
   stops describing what the domain offers and starts describing what it contains.

Each slice's `index.ts` carries a three-line docblock — it is the first file anyone opens, and it
replaces a per-feature README that would go stale:

```ts
/**
 * transaction-list — the month's movements: search, three filters, weekly navigation and category
 * correction from a modal.
 * Depends on: @/entities/transaction, @/shared/*
 */
export { TransactionList } from './ui/TransactionList';
```

### 3.6 Enforcing it with ESLint — no new dependencies

Any architectural rule you can move from prose into the linter, move. A convention in a document is
respected early and forgotten later; a lint error appears in the output of the command you just ran,
with the fix in the message.

This works with the core `no-restricted-imports` because every cross-slice import uses the `@/`
alias: the source is scoped with `files:` and the target with string patterns, so nothing needs path
resolution.

```js
// eslint.config.js
const BARREL_ONLY = [
  {
    group: ['@/entities/*/**', '@/features/*/**'],
    message: 'Import a slice through its public API: "@/entities/transaction", not internal paths.',
  },
];

const layer = (files, group, message) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns: [...BARREL_ONLY, { group, message }] }] },
});

export default tseslint.config([
  globalIgnores(['dist', 'blueprint']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
  },

  layer(['src/shared/**'], ['@/app/**', '@/features/**', '@/entities/**'],
    'shared is the lowest layer: it cannot import app, features or entities.'),
  layer(['src/entities/**'], ['@/app/**', '@/features/**'],
    'entities may only import from shared.'),
  layer(['src/features/**'], ['@/app/**', '@/features/**'],
    'A feature imports neither app nor another feature. If two need it, move it down.'),
  { files: ['src/app/**'], rules: { 'no-restricted-imports': ['error', { patterns: BARREL_ONLY }] } },

  // Purity of the derivation layer. Uses the typescript-eslint rule id ON PURPOSE: it is a
  // DIFFERENT rule id from the core one above, so both coexist instead of overwriting.
  {
    files: ['src/**/lib/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          group: ['react', 'react-dom', 'zustand', 'recharts', 'i18next', 'react-i18next',
                   'posthog-js'],
          message: 'lib/ is pure derivation: no React, no store, no i18n, no analytics.',
          allowTypeImports: true,
        }],
      }],
    },
  },
]);
```

Three traps worth an hour each:

- **In flat config, two objects setting the same rule id over the same files do not merge — the last
  one wins.** That is why `BARREL_ONLY` is repeated inside each layer object rather than living in
  one global `src/**` object, which would silently cancel the layer rules.
- The `lib/` purity rule overlaps with the layer rules, so it deliberately uses the
  **typescript-eslint** rule id — already installed, no new dependency, and a *different* id, so
  both coexist. Keep that comment or someone will "fix" it.
- **`blueprint` must be in `globalIgnores`.** It holds `.tsx` files outside the build; without the
  ignore, typescript-eslint finds a second candidate tsconfig root and refuses to parse the project.

The purity rule is not cosmetic: banning i18next inside `lib/` **forces** `formatCurrency(amount,
locale)` to take the locale as a parameter, which is the testable design. It also bans `posthog-js`,
keeping analytics out of the derivation layer once the PostHog wizard runs.

> `import/no-restricted-paths` expresses direction more naturally but needs `eslint-plugin-import`
> plus `eslint-import-resolver-typescript`, and resolver misconfiguration is a classic time sink.
> `eslint-plugin-boundaries` gives better messages at the cost of a dependency and its own DSL.
> Neither pays for itself here; note `boundaries` as the migration path past ~10 slices.

---

## 4. Naming

| Thing                       | Convention         | Example                                 |
| --------------------------- | ------------------ | --------------------------------------- |
| Components & interfaces     | `PascalCase`       | `TransactionRow`, `SummaryProps`        |
| Functions, hooks, variables | `camelCase`        | `computeSummary`, `useTransactionStore` |
| Module constants            | `UPPER_SNAKE_CASE` | `FX_USD_TO_MXN`, `CATEGORY_COLORS`      |
| Component files             | `PascalCase.tsx`   | `ExpenseChart.tsx`                      |
| Everything else             | `camelCase.ts`     | `normalize.ts`, `useLocale.ts`          |

---

## 5. TypeScript

`tsconfig.app.json` runs stricter than default: `strict`, `noUncheckedIndexedAccess`,
`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`,
`isolatedModules`, `erasableSyntaxOnly`.

### `any` is banned. `as` is nearly banned.

Exactly **one** cast is allowed for a value, at the JSON import boundary, and it carries a comment:

```ts
// movimientos.json is deliberately untyped aggregator output — this is the one intentional trust
// boundary in the codebase, where we assert its shape before normalize() validates every field.
const dataset = movimientosFile as unknown as RawTransactionFile;
```

The only other tolerated `as` is **widening a style object for CSS properties React's types do not
know** — `maskComposite` and `WebkitMaskComposite`, which `BorderGlow` needs on each of its three
inline style objects. It must be visible in review, not buried.

Everywhere else, narrow with a **type guard**:

```ts
export function isKnownCategory(value: string): value is KnownCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}
```

Narrow DOM types with `instanceof`, not a cast — `EventTarget` is not necessarily a `Node`:

```ts
if (event.target instanceof Node && wrapper.current?.contains(event.target) === true) return;
```

### `noUncheckedIndexedAccess` changes how you write code

Every index access is `T | undefined`, which bites in three predictable places:

```ts
const [, year, month, day] = regex.exec(input) ?? []; // each is string | undefined
const color = COLORS[i] ?? FALLBACK;                  // array lookup
const first = items[0];                               // even after a length check
```

Destructure with an explicit guard, or `??` with a real fallback. **Never silence it with `!`.**

### Model domains as unions, not `string`

```ts
export const CATEGORIES = ['Ingresos', 'Comida', …] as const;
export type KnownCategory = (typeof CATEGORIES)[number];
export type Category = KnownCategory | typeof UNCATEGORIZED;
```

The union drives the dropdown options, the colour map (`Record<Category, string>` fails to compile
if you add a category and forget a colour) and the store's mutation signature. One edit, and the
compiler lists every place that needs updating.

---

## 6. React

- Function components only; destructure props in the signature.
- Small and single-purpose. If a component both derives and renders three sections, split it.
- **Ephemeral UI state → `useState`.** **Shared or business state → Zustand.** Overlay open/close
  belongs in a store specifically so a deep trigger does not prop-drill.
- **Derive from props/state rather than syncing with an effect.** The selected week is
  `{ period, index } | null` compared against the current period, not a `useState` reset by an
  effect: a choice made for another month simply stops applying.

### Hook rules that lint enforces, and that will bite

**Never call `setState` synchronously in an effect body** — it cascades a re-render on every mount.

```ts
// ❌ lint error, and a wasted render on every mount
useEffect(() => { setReduced(query.matches); … }, []);
// ✅ initial value lazily; the effect only subscribes
const [reduced, setReduced] = useState(() => query.matches);
useEffect(() => { query.addEventListener('change', onChange); … }, []);
```

When state genuinely must flip after the first paint — a bar growing from 0, a sweep opening — flip
it inside a `requestAnimationFrame` and cancel that frame in the cleanup.

**Every timer, rAF loop and listener is cleaned up**, and a hand-rolled animation helper must
**return its own cancel function**. Without one, a re-trigger leaves the earlier run's loops alive
and two chains fight over the same value. **A cleanup that stops an animation should also return the
element to rest**, or a cancelled animation parks its half-drawn state on screen.

**`createElement`, not a capitalised binding, for components read out of a static map.** Assigning
`const Glyph = ICONS[category]` during render trips `react-hooks/static-components`.

**StrictMode double-invokes effects** (mount → cleanup → mount) on the same DOM node. Any cleanup
that destroys a resource attached to that node — a WebGL context is the classic — breaks the second
mount. Let the resource go with the element.

### Zustand store shape

Flat interface mixing state and actions, no middleware, `create<State>((set, get) => ({ … }))`.
Consumers select per field: `useStore((s) => s.field)`.

**Never build a derived array inside a selector** — a new array every render is an infinite loop.
Derive with `useMemo` in the component, or compute in the store on mutation.

---

## 7. Comments

Explain **why**, never **what**. Ultra-short, technical, written for whoever debugs this next.

Comment-worthy: a non-obvious rule ("unsigned string amounts are expenses unless the category is
`Ingresos`"), a load-bearing line that looks decorative (`z-30` fixing a stacking context), a
deliberate trade-off, a documented cast, a deviation from a vendored component's upstream source.
Not comment-worthy: restating the signature, narrating obvious control flow.

```ts
// ✅ context for the next reader
// Reads the calendar date from the ISO string instead of Date's local getters: the latter shifts
// across midnight when the viewer's timezone differs from the -06:00 offset in the data.

// ❌ noise
// This function normalizes the transactions
```

**A vendored component carries a docblock listing every deviation from its upstream source and why
each was forced.** That is what stops the next reader from "restoring" the original and
reintroducing the bug the deviation prevents.

---

## 8. Testing (Vitest)

Coverage is not an evaluation criterion, so aim narrow and high-value: roughly 80–90 pure tests
across ~10 files, `environment: 'node'`. Cover exactly what breaks silently:

1. **Normalization** — one test per quirk in the `ROADMAP.md` §2 audit.
2. **Summary rules** — out-of-period excluded, duplicates counted once, refunds netted, transfers
   excluded, disputed excluded.
3. **Category breakdown** and the 5% grouping.
4. **Weeks** — boundaries, clamping to the month, weeks bounded by data rather than calendar.
5. **Filters and search** — AND composition, the empty-filter identity case, accent folding.
6. **Untrusted input parsing** — corrupt and hand-edited persisted payloads.
7. **Store actions** — a mutation hits one row and clears its flag; corrections survive a month
   change; reset restores the original and keeps the language.
8. **Translation catalogues** — `es` and `en` expose an identical set of keys.

Do **not** write UI component tests (no `@testing-library`, and it is not graded).

**The architecture makes the target enumerable:** everything under `src/**/lib/**` plus
`entities/transaction/model/{normalize,persistence,store}.ts`. Nothing else needs a test, because
§3.4 guarantees no business logic survives in `ui/` — a rule you can verify with a glob.

Colocate as `*.test.ts` next to the source, so listing a directory to edit `filters.ts` surfaces its
test in the same listing. The `lib/` purity rule keeps these DOM-free: a function that cannot import
React can always be tested directly.

**Sanity-dump technique.** To verify derivation against the real dataset, write a throwaway test
that `console.log`s the numbers, run `pnpm exec vitest run <file> --reporter=verbose`, read it, then
**delete the file**. Anything worth asserting gets promoted into a real regression test.

---

## 9. Dead code

When one approach supersedes another, delete the old one **in the same commit**: the function, its
constants, its tests, its CSS and any UI copy describing it. Half-migrated logic is worse than
either version.

This applies to CSS especially, because nothing fails when it is left behind — an orphaned
`@property`, keyframe or animation token produces no error and no warning, just drift between what
the stylesheet says and what the app does.

Reference-only material lives **outside `src/`**, so it is never compiled, linted or bundled.
`blueprint/components/` is exactly that.

---

## 10. Formatting, linting & git hooks

Prettier for formatting, ESLint with the React Hooks + TypeScript recommended configs. Prefer early
returns over nesting.

`pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` must all be green before any commit.
Lint is not cosmetic — it is what catches the hook traps in §6 and the boundaries in §3.6.

**Husky enforces this; it is not left to discipline.**

| Hook         | Runs                                                                            | Why there                                              |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `pre-commit` | `lint-staged` → ESLint (`--max-warnings=0`) + Prettier on **staged files only** | Fast enough that nobody is tempted to skip it          |
| `pre-push`   | `pnpm typecheck && pnpm test`                                                   | Needs the whole project; too slow to run per commit    |

The split is deliberate: a full `tsc -b` on every commit is what drives people to `--no-verify`, and
a bypassed hook protects nothing. **Never use `--no-verify`.** If a hook fails, fix the cause; if a
hook is wrong, fix the hook.

---

## 11. Commits

**Conventional Commits with a leading emoji:** `<emoji> <type>: <description>`

| Emoji | Type       | Use for                               |
| ----- | ---------- | ------------------------------------- |
| ✨    | `feat`     | New capability                        |
| 🐛    | `fix`      | Bug fix                               |
| 🎨    | `style`    | Visual/UI change, no behaviour change |
| ♻️    | `refactor` | Restructure, no behaviour change      |
| 📄    | `docs`     | Documentation                         |
| 🔧    | `chore`    | Tooling, config, deps                 |
| 🧪    | `test`     | Tests only                            |

**The body matters more than the subject.** Reviewers read this history to understand how you
thought, so every non-trivial body answers: what changed, *why that approach*, and what was
rejected. State the trade-off explicitly when there is one.

Commit at **meaningful milestones** — a phase from `ROADMAP.md` §8 is roughly one commit. Never
commit files you did not intend: run `git status` after a broad `git add -A`.
