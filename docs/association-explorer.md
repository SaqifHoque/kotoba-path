# Kanji and word association explorer

Feature 6 of the learning redesign connects the existing study catalog without
changing learning progress. Open **Library → Explore connections**, or use an
item's Explore connections action in the starter reference chapter. Guided study
cards and checks offer **Explore this item**; Return to guided chapter restores
the same step, draft answer and feedback within the tab.

## What the explorer shows

- **Teaching components**: explicit authored shape links from the versioned
  curriculum. For example, 休 connects 人 displayed as 亻 with 木. Reverse links
  let a learner explore 休, 林 and 森 from 木.
- **Dictionary radical**: the primary radical that classifies a kanji. Selecting
  it shows other kanji with that classification. This group stays separate from
  teaching components.
- **Kanji in a word**: the canonical kanji referenced by that vocabulary subject.
  Readings are displayed for the whole word; the explorer does not invent a
  character-by-character reading split.
- **Related words**: words using the selected kanji; for a selected word, other
  words sharing any of its kanji. Related-word lists are deduplicated and exclude
  the selected word itself.
- **Learning context**: existing catalog hints, the starter chapter's original
  memory aids and sentences, current typed-study stage, saved mnemonic note and
  personal meaning synonyms. These are displayed for the current account only.

Component links are currently authored for four kanji: 休, 明, 林 and 森. Other
kanji explicitly say that teaching links have not yet been authored. The explorer
uses dictionary classification and word membership throughout the current typed
catalog; it does not generate or imply complete decompositions. Existing data
attribution and the distinction between memory stories and etymology remain.

## Finding and navigating items

Search accepts kanji, kana readings and English meanings, including curated
meaning aliases. Kana normalization handles hiragana/katakana and half-width
input. Results prioritize exact character/word and reading matches, show the
subject kind, and cap the visible result list at 24 with a total match count.
An empty query offers the starter chapter's eleven kanji/word subjects. An empty
result has a clear message and leaves the current detail available.

Selecting a result or connection focuses its detail heading. Pressing Enter in
the search input selects the first result. Previous item keeps a short in-memory
trail (up to 20 entries). Large word and dictionary lists start at twelve items;
Show more adds twelve at a time. Desktop uses a search/detail layout; narrow
screens stack the sections without horizontal page scrolling.

The selected subject is retained while navigating this tab. Query, item history
and expanded-list counts belong to the explorer view and reset when it closes.
There are no persisted graph preferences or exported explorer data. The app
continues using the same stable subject IDs from the catalog.

## Progress contract

The relationship/search models read the shared typed-course catalog. The view
only reads current study state. Browsing, searching, following links, showing
more items and returning to a lesson do not introduce subjects, alter stages or
due dates, update notes/synonyms, enqueue history, or write local storage.

Guided lesson state remains in its existing service when the explorer opens.
Return resumes practice without submitting the draft. Deliberate study/review
answers still use the existing learning and scheduling paths. The explorer is
inside the app's account-change guard, so old account details disappear while
an account is changing.

No backend endpoints, database migrations, curriculum edits, dependencies or
changes to the scheduling algorithm are included. All explorer content works
from the bundled catalog in the device-only demo.

## Review guide and validation

`association-index.ts` builds distinct forward/reverse relationships by stable
subject ID. It rejects duplicate subjects, dangling component links and words
whose kanji are missing. Detail arrays are separate from the reverse indexes.
`association-search.ts` precomputes normalized terms once per catalog load.
`association-explorer.component.*` renders the relationships and handles local
navigation. Chapter/player outputs and the app shell preserve the return context.

From `frontend`:

```sh
npm run test:associations
npm run test:engines
npm run build
npm run build:demo
```

The association suite covers real authored component forms, reverse links,
dictionary separation, whole-word membership, related-word deduplication,
coverage across the full typed catalog, deterministic normalized/bounded search,
unknown IDs, invalid references, and immutable catalog reads. The suite is part
of frontend CI. Existing learning, saving and guided-player suites remain intact.

Browser verification on the built demo checks desktop and 390px mobile flows,
Library and contextual entry points, kana/English search, keyboard selection,
reverse links, sentences, pagination, empty/missing-content messages, saved
notes and synonyms, and returning with a guided draft/cursor intact. Storage
snapshots include a pending review event and are compared before/after browsing;
network mutation requests and runtime errors are also checked.
