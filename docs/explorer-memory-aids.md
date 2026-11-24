# Personal memory aids in the explorer

The kanji–word explorer now offers **Edit memory aids** beside each selected item.
Browsing remains read-only. Edits take effect only after **Save memory aids**.

## Notes and meaning synonyms

Personal notes accept up to 1,000 characters and require an existing typed-study
record. The note input is disabled for unintroduced subjects; saving a note never
creates an Apprentice record.

English meaning synonyms can be saved for any catalog subject without introducing
it. They reuse the existing rules: at most eight single-line values, 80 characters
each, normalization/deduplication and English/numeric input. They affect subsequent
meaning checks in the existing typed/guided players, not Japanese reading targets.
Published meanings and readings remain intact.

Clearing a note or all synonyms saves the existing empty/timestamped representation.
It does not delete the subject or restore old aliases during a normal timestamp
merge. Re-saving normalized unchanged values is a no-op.

## Drafts and navigation

Unsaved drafts are held per subject in account-scoped tab memory. They survive
following connections, Previous item, leaving the explorer and returning from
other app views. Cancel discards that subject's draft. A successful save refreshes
its baseline and leaves the form open.

A before-unload handler requests the browser's native protection when any dirty
draft exists. Browser support/user activation determines whether a prompt appears.
Reload still closes unsaved drafts; there is no new persistent draft storage.
Changing accounts clears the old account's in-memory drafts. Confirming a progress
import clears all memory drafts through the existing session-reset path.

## Conflict and save boundaries

The editor captures current note/synonym values and timestamps. Before saving it
compares that baseline with the currently loaded synchronized memory fields.
If they differ, it keeps the draft, blocks save and offers an explicit **Reload
saved memory aids** action. Reload replaces the unsaved draft.

Review-track changes alone do not cause an editing conflict. Saving uses the
latest loaded record and changes only note fields and/or meaning-synonym fields,
preserving stages, dates, lesson times, notes on other subjects and course settings.

This is a guard against changes already known locally. It is not a server-side
field lock: changes that have not yet reached this tab still use the existing
server revision-conflict and timestamp-merge rules. Note timestamps advance
monotonically, including when the previous note timestamp is ahead of the device
clock. Timestamp overflow rejects the edit.

Validation happens before the single shared profile update, so an invalid synonym
cannot partially save a note. The existing saving indicator distinguishes device
saving from server sync. Editing adds no review-history event or scheduled score.

## Data compatibility

No new backend API, schema, dependency, progress-file version or storage key is
added. Notes and synonyms use existing typed-study IDs, fields, sync and import/
export behavior. Account/loading/catalog guards block unavailable or stale drafts.
Saved notes and synonyms remain visible through existing explorer/review surfaces.

## Verification

Run `npm run test:memory`, `npm run test:engines`, `npm run build` and
`npm run build:demo` from frontend.

All 23 frontend engine suites, 32 existing backend tests and production/demo
builds passed locally (initial bundle about 594 kB, within existing budgets).
Pure tests cover immutable records, latest-track preservation, stale memory
fields, atomic validation, clearing, future synonym grading, no enrollment,
idempotence and monotonic/overflow timestamps.

Desktop and 390px Chrome → real API → isolated H2 verified note/synonym saving,
validation without partial writes, no-op saves, unintroduced-subject synonyms,
draft recovery across navigation, an actual profile revision merge followed by a
stale-note conflict, clearing, personal-synonym grading, preservation of scored
tracks/feedback and exact history counts, import reset, unload protection and
reload. No horizontal overflow or runtime errors occurred.

Backend source/schema is unchanged. The test API applies the existing V5 migration
on an isolated database; this PR introduces no additional rollout requirements.

Use [My memory aids](memory-library.md) in Library to find saved notes/synonyms and return from the explorer with collection filters intact.
