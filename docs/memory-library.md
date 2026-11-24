# My memory aids

Library now offers **Open my memory aids**, a dedicated collection of saved
personal notes and accepted meaning synonyms.

## Finding saved content

Only known catalog subjects with a nonempty saved note or at least one saved
synonym appear. Empty notes, cleared synonym tombstones, unknown IDs and unsaved
editor drafts do not create collection entries. Synonyms saved before a subject
is introduced are included and labeled **Not introduced**.

Search covers Japanese text, published readings/meanings, the personal note and
personal synonyms. It normalizes full-width text, case and katakana/hiragana.
Space-separated query terms must each match at least one field. Search queries
stay in the browser; the collection uses the already-loaded catalog and profile.

Filters select subject type and notes/synonyms. Sorting uses stored edit timestamps
or Japanese text order, with stable subject-ID tie breaking. “Recently edited”
reflects note/synonym timestamps, including their existing device-clock semantics.

The view initially renders twenty results. **Show 20 more memory aids** expands
the current result set. Changing a search/filter/sort resets the visible limit.
Counts distinguish all saved items, matching items and visible rows.

## Explorer round trips

Each entry opens the existing explorer at its canonical subject ID. **Return to
my memory aids** restores the tab's query, filters, sorting and expanded limit.
The selected button and scroll position are restored while that entry still
matches. If an edit removes it from the current results, focus returns to the
collection heading.

Rows use stable subject IDs so recalculating the derived results does not remove
a focused button. Navigating away before a scheduled restoration cancels that
frame, preventing stale scrolling/focus on another view.

The existing explorer editor handles saves and draft recovery. The collection
shows saved state only, so a saved edit appears immediately on return and clearing
the last aid removes the entry. It does not introduce or score a subject.

## State and privacy boundaries

Query/filter/page/return state is held in tab memory, scoped to the active
account. Reload resets this view state while saved notes and synonyms remain.
Account changes and loading guard the collection. Confirming a progress import
resets the collection filters and return state alongside existing session resets.

The collection creates no profile writes, new storage keys, backend queries,
review history, enrollment, stage/due changes or new export fields. Existing
profile sync is still responsible for loading and saving actual memory aids.
Notes render as text, and previews are limited to 200 characters.

## Verification

Run from frontend:

```sh
npm run test:memory-library
npm run test:engines
npm run build
npm run build:demo
```

All 24 frontend engine suites and production/demo builds passed locally (initial
bundle about 606 kB, within existing budgets). Collection tests cover empty/
cleared content, known IDs, duplicate catalog identities, introduced status,
kana/full-width/multifield search, filters, deterministic ordering, clearing and
immutable source notes/readings/synonyms.

Desktop and 390px Chrome → unchanged real API → isolated H2 verified:

- 31 saved items with a twenty-row initial limit, filters, search and expansion.
- No server-state changes while browsing/searching/paging.
- Editing and returning to a thirty-row filtered/sorted list, with button focus.
- Clearing the selected note, removing its entry and restoring heading focus.
- Unintroduced word synonyms, kana search and no extra study record.
- Import filter reset, tab reload behavior, empty/new profile isolation, unchanged
  review tracks and zero extra history events.
- No horizontal overflow or browser runtime errors.

Backend source/schema is unchanged. The browser used the backend artifact
verified by the preceding memory-editor PR; backend tests remain in existing CI.
