# Trouble spots

Review → **Find trouble spots** shows introduced typed-course skills with repeated
scheduled misses. Meaning and reading are separate entries. This extends the
existing typed-course weak-item rule into an explained, searchable screen.

## Selection and evidence

A skill needs at least three misses and less than 80% correct across its saved
scheduled reviews. Burned skills, missing catalog subjects and unsupported reading
tracks are excluded. Only the qualifying skill is selected: a difficult reading
does not automatically add its meaning question.

The screen shows misses, correct/review counts, a rounded correct percentage and
the scheduled due date. Inclusion uses exact counters, so 12 correct out of 15 is
80% and excluded. Order is highest miss count, then lower correct ratio, then
stable subject/skill identity. It is not ordered by recent mistakes.

These are lifetime counters from the saved typed-course state, including imported
progress. They are not a recent-history calculation or retention prediction.
Reading-path self-ratings, guided checks and extra practice are excluded. The
feature needs neither a history download nor new database queries.

Filter by item type, meaning/reading, due-now status or search. Search matches
characters, canonical meanings/readings and personal meaning synonyms, with
case/width and katakana/hiragana normalization. All search tokens must match.
The list shows 20 skills at a time, with explicit additional pages. Due-now status
refreshes approximately every ten seconds while open. Empty progress and no
matching filters have distinct messages.

## Memory support and focused practice

**Explore … and edit memory aids** opens the existing explorer/editor. Returning
preserves filters, pagination, scroll position and focus on the original skill
when it still exists. Saved notes are visible in the list; edits use the existing
memory-aid save path.

**Start a new practice** uses the first ten matched skills, independently of the
number of displayed rows. A filtered list with one skill creates one question.
Future-due skills are included unless the due-now filter excludes them. The
practice service recalculates candidates from current saved progress on launch.
Starting a new round explicitly replaces any existing tab-local mistake practice.

The existing correction player uses current canonical answers and personal meaning
synonyms. Format retries stay unscored. Accepted answers, memory support, explorer
lookup and word audio appear only after checking/revealing. A question retains its
first actual result. Early finish reports unanswered questions honestly.

Pause returns to Trouble spots. The Review/Today open-session controls resume the
same round and draft. Practice/explorer return preserves feedback. Batch-origin
mistake practice still returns to typed reviews and resumes the same unfinished
source batch. See [mistake practice](mistake-practice.md).

Extra practice does not change stages, counters, due dates, history, quest credit
or storage. A correct **scheduled** review can improve a counter enough to remove
that skill from the list. Practising it correctly cannot do so.

## Boundaries and verification

The list reads the current account's saved profile, including the device-only
public demo. Account changes reset list state and guard practice; confirmed
progress imports clear filters and transient sessions. Reload discards filters and
practice, while saved counters continue to power the list. No new storage key,
backend/schema change, export version, dependency or tracking event is added.

From frontend:

```sh
npm run test:trouble-spots
npm run test:engines
npm run build
npm run build:demo
```

The regression suite covers threshold boundaries, separate skills, canonical
content, exclusions, stable ordering, search and due filters, pagination-independent
practice limits, account/loading guards, session reset, source-specific return,
first-answer behavior, same-batch resume and unchanged input state. The actual tab
services are exercised with injected test boundaries as well as the pure models.

All 26 frontend engine suites, 32 existing backend tests and production/demo
builds passed locally (initial bundle about 633 kB, within the existing budgets).
Desktop Chrome → real API → isolated H2 verified independent skill selection,
search/due filters, explorer return/focus, personal meaning grading, kana retries,
post-answer support/audio, pause/hub resume and import clearing. Saved server
state, history and device storage remained identical throughout extra practice.
An actual correct scheduled answer moved one skill from 11/14 to 12/15 correct,
removing that meaning skill while preserving its separate reading trouble spot.

390px Chrome verified 20/25 pagination, the ten-question practice limit, honest
early finish, no-match feedback and saved-counter persistence after reload. Empty
profiles and device-only demo practice also passed, with no horizontal overflow
or browser runtime errors. Backend source and schema are unchanged.

Supported kanji now link to [side-by-side comparison](kanji-comparison.md), preserving the original study return path and saved progress.
