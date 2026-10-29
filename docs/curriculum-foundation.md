# Curriculum foundation

This is feature 3 of the learning redesign, after saving UX and unified study
navigation. It establishes identities and teaching relationships for the next
starter-chapter and guided-lesson PRs. It does not author a full chapter.

## Runtime contract

The app loads `kanji-curriculum.json` and `curriculum-manifest.json` together.
`applyCurriculum` validates both before `StudySyncService.initialize` can read,
filter, merge or write progress. A missing/invalid manifest uses the existing
catalog error and Retry catalog action. No partial catalog initializes sync.

The source asset still comes from Kanji Alive with its existing attribution.
The manifest is a checked-in, explicitly maintained registry, not regenerated
from current display strings on every build. Entries use one line each so an
identity or level edit is visible in review.

- `schemaVersion: 1` defines this registry format; unsupported schemas fail.
- `curriculumVersion: "1.0.0"` identifies this content release. Bump it whenever
  changing registry content. It is separate from progress/backup format version 1.
- The 1,234 kanji retain their `k:character` IDs and existing 103 level allocations.
  Reordering source rows cannot renumber levels or change radical lesson levels.
- The 3,349 vocabulary entries have explicit `v:` IDs. The initial IDs deliberately
  equal the previous derived IDs. Display text/reading and identity are now separate.
- Primary radicals retain their normalized `r:` IDs. Kanji and vocabulary path
  progress retain their existing character and vocabulary keys respectively.

No user-state rewrite is needed for this first registry release: old caches,
server snapshots, Forge files, unified backups, notes, synonyms, event subject IDs
and pending outbox IDs keep the same keys. There is no invented learning activity,
stage advancement or history migration. Scheduling and unlock prerequisites stay
unchanged. Existing pure-engine callers without metadata retain the legacy builder.
The application runtime always requires the manifest.

## Components versus primary radicals

A dictionary primary radical classifies a kanji; it is not its complete visual
breakdown. `components` supplies separate, optional teaching links. Each link has
an existing subject ID and the form to display inside the target kanji. For
example, 休 links to 人 shown as 亻, plus 木. 明 links to 日 and 月; 林 and 森
link to 木. A link denotes a component type, not an occurrence count or layout.
These are original mnemonic teaching choices, not historical etymology claims.

Only those four kanji have authored links in this PR. Empty arrays mean
"not authored", not "no components". References must exist, be unique per target,
have a nonempty display form, and form an acyclic graph. Forge subjects expose
these links independently of `prerequisites`; the next lesson/explorer features
can consume them without changing SRS gates.

## Editing and compatibility

1. Update source/generated display data as needed. `npm run generate:kanji`
   regenerates the source asset, never published identities or level assignments.
2. Update the matching manifest entry and bump `curriculumVersion`. To correct a
   word's text or reading, edit those fields and its source examples together,
   retaining the old `id`. That keeps both vocabulary and Forge progress attached.
3. Run `npm run test:engines` and `npm run build`. Coverage validation rejects
   missing or unused words, duplicate IDs, missing kanji, invalid levels, changed
   primary radical identities, dangling components and cycles.
4. Review the diff for unchanged IDs and level assignments. Tests compare this
   initial release to the legacy catalog; a future intentional content correction
   must replace the relevant baseline assertions with a compatibility fixture.

This version deliberately supports the existing 103 levels. Adding/removing
kanji, renaming kanji/radical IDs, changing gates, merging word identities, or
replacing levels with curated chapters requires a separate migration design and
explicit old-state fixtures. A version bump alone does not migrate user data.
Do not delete an ID with saved progress, or reuse it for a different subject.

## Validation

`npm run test:foundation` covers every current Forge record and both review tracks,
all kanji/vocabulary progress keys, notes, synonym tombstones, unified and standalone
Forge imports, unchanged lesson eligibility, pinned levels after source reorder,
a reading correction retaining its identity, and invalid registry releases.
The suite is included in `test:engines` and therefore existing frontend CI.

Browser checks exercise loading both assets, entering typed lessons, downloading
progress, restoring a legacy record, and malformed/missing manifest retries while
preserving cached progress. This PR adds no backend endpoints or database schema.
