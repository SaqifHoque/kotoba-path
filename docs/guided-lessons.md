# Guided starter lessons

Feature 5 of the learning redesign builds on the authored starter chapter in
PR #36. **Learn** and **Library** offer Begin guided chapter, Continue guided
chapter, or Practise chapter again. The reference chapter remains available.

## Learning flow

The player contains 38 small steps: five shape cards, then a study card plus
meaning and reading checks for each of five kanji and six words. Each screen
shows one step, a progress indicator, and Pause & return to Learn. Meaning
answers use English; readings accept hiragana or katakana through the shared
answer checker. Wrong answers show accepted answers and allow another attempt.
Wrong-script/other-listed-reading retries remain unscored.

Kanji study cards explicitly show the existing typed-review readings, alongside
the chapter's word-focused reading explanation. For example, the 人 kanji check
accepts its catalog readings ジン/ニン; the 人 vocabulary check accepts ひと.
The curated “day off” alias for 休日 also works in scheduled typed reviews.

New subjects enter typed reviews only after both meaning and reading checks.
They use the existing record initializer: both tracks at Apprentice I, due four
hours later, zero scheduled-review attempts. Passing practice never advances
an existing track, brings a review forward, unlocks a level, or resets a note.
Existing and Burned records are preserved when the chapter is replayed.

Actual scored checks create **learning** history events through the existing
outbox; they never masquerade as scheduled reviews. Reading the study/shape
cards creates no events. Retry-format checks create no events. Repeating an
actual check after reload can create another learning event, as another attempt.

## Catalog and pacing

The typed-review catalog adds the five chapter-only vocabulary subjects using
their explicit IDs. 休日 reuses its published subject and saved record. All five
new words are included in typed-review queues, sync parsing, notes, synonyms,
and unified/Forge backup imports. The independent reading-path vocabulary
catalog is unchanged.

The authored chapter is an alternate introduction path for its eleven subjects:
it can introduce them in the chapter's teaching order before the legacy course's
level/Guru gates. It retains their published level assignments and does not
advance the unlocked-level counter. The ordinary typed course still uses its
existing gates. All introduction paths share the same records and due queues.

Daily lesson limits and workload guards apply. The default ten-item allowance
may pause before the eleventh new subject; the position stays at that subject.
A paused learner can do scheduled reviews or return when their allowance is
available. Previously introduced subjects remain available for practice even
when new lessons are paused. The final screen means the steps were practised,
not that the subjects were mastered.

## Resume and isolation

`GuidedLessonService` keeps draft answers and current feedback while navigating
within the tab. It saves a versioned chapter ID, chapter version and step cursor
under the account-scoped `kotoba-guided-lesson-v1` device key. Return through
Learn/Library after reload to continue at the saved step. Unsaved draft input
and feedback are not restored after reload.

Guest and signed-in cursors have separate namespaces. The player blocks actions
while account changes are in progress. Importing progress clears the in-memory
session and its resume key so an old check cannot be applied after an import.
A malformed or incompatible cursor offers a new chapter start while preserving
subject progress. If the cursor claims to have passed an introduction but its
record is absent after reload, reconciliation returns to that study card.

A failed resume write is explained as a tab-only position. The shared saving
indicator separately reports whether actual study progress reached device or
server storage. A cursor is a device convenience, not account-synced progress;
it is excluded from progress-file exports. Simultaneous tabs keep independent
in-memory lesson positions; the latest saved device cursor is used on reload.

## Review guide and validation

- `chapter-subjects.ts`: register additional words without duplicating published IDs.
- `guided-lesson.ts`: pure step, cursor, pacing and enrollment rules.
- `guided-lesson.service.ts`: account-scoped persistence and existing sync/history integration.
- `guided-lesson.component.*`: focused study/check/feedback/pause screens.
- App/study hub integration: launch, return, open-session navigation and import reset.

Run from `frontend`:

```sh
npm run test:guided
npm run test:engines
npm run build
npm run build:demo
```

The guided suite covers the complete step sequence, wrong/retry/stale feedback,
shared IDs, due-queue inclusion, backup round trips, existing/Burned state,
daily/workload pauses, and malformed/stale/missing-record resume recovery.
Existing answer-alias tests now check the shared subject catalog so vocabulary
aliases receive the same validation as kanji aliases.

No backend schema/API changes or new dependencies. Backend verification and real
API-backed browser checks validate the existing persistence/history contract.
Chapter progression/rewards, the association explorer, and audio remain later
features in the roadmap.

Local verification passed: all 15 frontend engine suites, 23 backend tests, and
production/demo builds. Chrome against the real API and an isolated H2 database
completed all 38 steps: 11 records at stage 1 with four-hour due dates, 23 actual
learning events (22 correct checks and one incorrect), and zero scheduled events.
Replay preserved Burned records and notes. Account namespaces, daily-limit
pauses, mobile keyboard controls, blocked resume storage, malformed cursors,
offline introductions and import invalidation were also verified in the browser.

The [association explorer](association-explorer.md) is available from each
guided subject. Returning from it keeps the current step, feedback and draft
answer without submitting a check or changing the review schedule.
