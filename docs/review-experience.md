# Scheduled typed-review experience

Feature 7 of the learning redesign gives scheduled meaning/reading reviews a
focused screen. Today recommendations, Review, and the typed-course dashboard
all use the same session. Reading-path self-assessment and vocabulary-only
practice keep their existing screens.

## Batches and prompts

Review offers batches of up to 10, 20 or 40 questions; the default is 20. A batch
contains only tracks that are due when it begins, in the existing due order.
Newly due work waits for a later batch. Meaning and reading count as separate
questions and can have different dates. Progress shows answered/skipped/total
questions, with subject counts separately in the summary.

The prompt identifies the subject kind and clearly asks for English meaning or
kana reading. The shared answer checker accepts existing source answers,
curated aliases and personal meaning synonyms. Wrong-script or another listed
kanji reading returns an unscored retry. The learner can correct the input.
An empty accidental submission does nothing; **I don’t know** explicitly records
an incorrect review.

## Scoring and feedback

**Check answer records the review immediately.** Continue moves to the next
question and never scores again. Leaving after feedback keeps that scored
answer, even before Continue. The existing save indicator explains whether the
answer has reached the device/server; the session does not claim a cloud save
when the app is offline.

Feedback shows accepted answers, the affected skill’s stage change, and its
next review date. A Burned skill explicitly has no next scheduled date. A closed
memory/context disclosure and the association explorer are available after a
scored answer; returning from the explorer preserves feedback and the batch.
Saved notes can be read there. Note/synonym editing remains available in the
typed course’s practice tools.

The existing `review` engine still calculates stages, intervals and level unlocks.
This feature adds no scheduling rule, undo, XP award, early review or automatic
requeue of missed questions. Scored checks emit one scheduled-history event
through the existing durable outbox; format retries and skipped questions emit
none. Regular lesson/practice behavior remains separate.

Each batch ticket captures its track’s stage, due time, review counters and
update time. Before scoring, these are checked against current synchronized
state. A changed, missing, future or Burned track is skipped without overwriting
its newer value or creating a history event. Notes and synonym edits do not
invalidate an otherwise unchanged track. This check uses state currently known
to this tab; existing server revision/conflict handling remains responsible for
remote updates that have not arrived locally yet.

## Pause, finish and summary

Pause & return to Review keeps the question, draft and feedback in this tab.
Today and Review can resume that open session. Starting another batch explicitly
replaces its unsubmitted questions; scored work remains saved.

Finish for now opens the summary and leaves unanswered tracks unchanged and due.
A completed batch also opens the summary. Counts distinguish correct, incorrect,
skipped and unanswered questions, plus subjects with a scored answer. Accuracy
uses scored answers only; a batch with no scored answers displays a dash. The
mistake list offers accepted answers and memory aids without recording practice
or mastery. Start next batch takes a fresh snapshot of currently due questions.

Reload closes the transient batch and draft. Already scored answers stay in
normal progress/history storage; unsubmitted questions remain due. There is no
new session storage key, backup format or cross-device session cursor.

The service is bound to the current account, blocks actions during account
changes, and is cleared after a progress import so an old question cannot be
submitted against the newly imported state.

## Review guide

- `reviews/review-session.ts`: pure due-batch tickets, single-score submissions,
  stale-track checks, finish/continue transitions and summary counts.
- `reviews/review-session.service.ts`: tab-local session state, account guard and
  the existing progress/history saving path.
- `reviews/review-session.component.*`: prompts, feedback, pause/finish and summary.
- App shell and typed-course routing: one scheduled typed-review entry point;
  the legacy course no longer has its own scheduled-scoring branch.
- Review hub: explicit batch sizes and question/subject units.

No backend API/schema changes, curriculum edits or new dependencies.

## Validation

From `frontend`:

```sh
npm run test:review-session
npm run test:engines
npm run build
npm run build:demo
```

All 17 frontend suites and 23 backend tests pass. The new suite checks due-only
sizes, immediate single scoring, interval/stage behavior, retry handling,
independent/Burned tracks, changed-state skips, note preservation, finish safety,
empty batches and question/subject summaries. Existing recommendation tie-breaking
still prefers the selected course when due times are equal.

Chrome against the real API and an isolated H2 database verified saving before
Continue, duplicate prevention across navigation, unchanged unscored retries,
incorrect lapses, Burned feedback, explorer return, draft/feedback resume, early
finish, four actual scheduled events, reload before Continue, a ten-question
limit from a larger due pool, and the legacy dashboard entry point. The built
390px demo verified keyboard controls, offline saving, import invalidation,
I-don’t-know scoring and a correct zero-accuracy summary.

A further real-API check received a newer track through an actual save conflict
and merge. The open review was skipped without altering that track or adding a
scheduled-history event.
