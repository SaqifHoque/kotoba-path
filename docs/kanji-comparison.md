# Compare similar kanji

Library → **Compare similar kanji** opens a side-by-side study screen. The explorer
also offers this action for supported kanji. Trouble spots shows **Compare kanji …**
on supported skill rows, retaining that row's filters and return position.

## Content and meaning

The feature reuses the typed course's existing curated visual groups through
`contrasts`. A group is a study suggestion, not evidence that the learner confused
its characters. Only available catalog kanji with an available counterpart are
selectable. The second selector is restricted to the first kanji's group; self
pairs, arbitrary IDs, vocabulary and radicals cannot become comparison pairs.

Each panel uses canonical current catalog content:

- meaning, typed-review target readings and other listed readings;
- authored teaching component forms, separate from dictionary radical links;
- the existing memory prompt, labelled as memory support rather than etymology;
- up to three linked words, with whole-word readings and the actual catalog count;
- saved personal note and accepted meaning synonyms;
- separate saved meaning/reading stages, or an explicit not-introduced state.

Teaching component links can be incomplete. Dictionary classification is not a
complete character decomposition. A kanji target reading does not apply to every
word: the word links use their own readings and open the existing explorer for
context and audio. This PR adds no new linguistic dataset or similarity algorithm.

On narrow screens, a compact pair of glyphs remains side by side above the stacked
details so both outlines can be compared together.

The study prompt asks the learner to notice a visual difference and connect each
character to a word. It does not grade an answer, assert mastery or award credit.
Unintroduced counterparts can be inspected without being introduced or unlocked.

## Navigation and personal notes

Pair selection stays in the tab. Returning from a word/kanji lookup preserves both
selected characters and restores focus and scroll to the original lookup button
when it still exists. Returning to the original study screen preserves a Trouble
spots filter and row focus. If comparison began in the explorer, its original
selected kanji and parent screen are restored even after a nested word lookup.
Opening comparison again from its own explorer keeps the original return target.

**Explore … and edit memory aids** uses the existing editor and save path. Saved
note/synonym changes appear when returning to comparison; normal draft and conflict
handling remain in that editor. Browsing itself writes no notes or progress.

## Account and saving boundaries

The service requires ready progress and a stable account. Account changes reset
selection/return state before exposing saved notes. Confirmed imports clear tab
selection and return context. Reload discards selection, while saved memory aids
and review tracks persist through their existing save paths. The public demo uses
the same feature with device-only progress.

No new API, schema, export field, local-storage key, dependency, review event,
quest event or scheduling rule is added. Browsing leaves due dates, stages,
counters, history and unlocked levels unchanged. Missing catalog groups have an
explicit empty state; unsupported item entry points are not shown.

## Review sequence and checks

The PR has six focused commits: canonical model; account-scoped pair state;
comparison UI; source navigation; regression coverage; documentation.

From frontend:

```sh
npm run test:kanji-comparison
npm run test:engines
npm run build
npm run build:demo
```

The regression suite exercises canonical pair eligibility, invalid/self/non-kanji
IDs, component/radical separation, independent skill stages, bounded word links,
notes/synonyms, account/loading guards, import reset, catalog replacement and
unchanged input data. It also exercises the actual comparison service with injected
account/profile boundaries. Rendering tracks each side by canonical identity so
ordinary change detection preserves lookup buttons and focus.

All 27 frontend engine suites, 32 existing backend tests and production/demo builds
passed locally (initial bundle about 651 kB, within the existing budgets).
Desktop Chrome → real API → isolated H2 verified canonical pairs, independent
stages, unintroduced peers, notes/synonyms, bounded word links, explorer/audio
lookup and pair/focus restoration. Server state, review history and device storage
remained exactly unchanged throughout browsing.

The browser checks also covered nested return paths, Trouble spots filters/focus,
an intentional note-only edit with unchanged meaning/reading tracks and history,
reload persistence and import reset. At 390px, both outlines appear together above
stacked detail panels; keyboard selectors work with no horizontal overflow.
Device-only demo and empty-profile browsing passed, with no browser runtime errors.
