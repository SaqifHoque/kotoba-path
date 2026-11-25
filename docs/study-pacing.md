# Study pacing and comeback guidance

Feature 12 adds a manageable typed-study pace to Today, Learn and Review. It
explains the existing workload rules and offers a small review entry point.
Reading-path queues remain available through **See all review queues**.

## Small sessions and older work

**Take up to 10 typed questions** opens the existing scheduled-review player with
a ten-question limit. It selects due questions only; meaning and reading count
separately. An explicit pacing entry starts an unscoped typed batch. Existing
sessions still offer their ordinary resume controls.

When any typed question has been due for seven elapsed 24-hour days or more,
the heading changes to **Pick up gently** and shows the older-question count.
This describes overdue work, not a claim that the learner was absent. No
last-visit timestamp or inactivity flag is introduced.

The panel shows the exact due question/subject counts, oldest typed due date,
and next future typed review when caught up. Burned tracks are excluded from
due counts. Counts refresh on saved-state updates and approximately every ten
seconds while mounted.

Review summaries also offer **Take another small batch · up to 10**. This keeps
an existing chapter scope when applicable. Stopping early leaves unanswered
tracks due; scoring still saves each answer immediately. Another batch never
defers, resets or fabricates a review.

## Daily typed introductions

The form selects the existing shared `dailyLimit`: 5, 10 or 20 new subjects per
local calendar day. Saving explicitly changes only `dailyLimit` and
`settingsAt` through the existing profile sync path. Selecting the current
value is a no-op.

The same setting already governs ordinary typed-course and guided introductions.
Reading-path lessons retain their existing rules. Lowering a limit below the
number already introduced today keeps those subjects and leaves zero remaining
allowance.

The panel follows the existing `lessonAllowance` priority:

1. At least 20 due typed questions pause new introductions.
2. At least 50 Apprentice subjects pause new introductions.
3. Reaching the daily introduction limit leaves no daily allowance.
4. Otherwise show the remaining allowance; published prerequisites still apply.

These are explanations of existing rules, not new scheduling restrictions.
Previously introduced subjects remain available for replay under the existing
guided-player behavior.

## Saving and isolation

The form uses the existing global saving indicator. An updated limit can be saved
on the device while waiting for the API; the panel does not claim server success
before that indicator confirms it. Device/demo settings survive reload.

Loading/account changes guard reads and saves. Imported or synchronized limits
refresh the form when the observed saved limit changes. A pending form selection
is not an automatic setting change.

No new storage key, API, database field, export version, history event, stage,
due-date adjustment or account marker is added. Existing notes, synonyms,
introduced records and unlocked levels are preserved.

## Review guide and validation

- `study-pacing.ts`: read-only workload snapshots and immutable daily-limit
  replacement.
- `study-pacing.service.ts`: loading/account guards and existing save integration.
- Pacing component: overdue guidance, counts, small-session entry and limit form.
- Today/study hub: entry points; review summary: scoped ten-question continuation.

Run from frontend:

```sh
npm run test:pacing
npm run test:engines
npm run build
npm run build:demo
```

All 22 frontend engine suites and production/demo builds passed locally (initial
bundle about 587 kB, within existing budgets). Tests include the seven-day
boundary, independent/Burned tracks, due thresholds of 19/20, the 50-Apprentice
guard, local introduction counts, limit validation/idempotence and unchanged
records/levels.

Desktop and 390px Chrome against the unchanged parent API and isolated H2 verified
limit-only persistence, no write for saving the current value, ten-question entry,
early finish after five actual answers, seventeen untouched due tracks, chapter
scope on continuation, notes, exact history counts and reload persistence.
Empty-queue/mobile behavior and offline-demo device persistence also passed, with
no horizontal overflow or browser runtime errors.

Backend source and schema are unchanged; backend tests remain in CI. The local
API flow used the backend artifact verified with the preceding quests feature.

See [focused mistake practice](mistake-practice.md) for retrying missed questions without changing scheduled results or review history.
