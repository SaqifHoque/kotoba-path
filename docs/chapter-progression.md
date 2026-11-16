# Chapter journey and progression

Feature 10 makes existing chapter progress visible in Learn, Library and the
guided lesson's completion screen. It covers the one published starter chapter:
**People, trees & a little rest**. It does not add placeholder chapters or unlock
unpublished content.

## Three milestones

1. **Recognize the kanji:** five kanji with both meaning and reading tracks.
2. **Connect whole words:** six words with both meaning and reading tracks.
3. **Strengthen recall:** eleven subjects whose meaning **and** reading stages
   are both at Guru I or above.

These are derived from existing typed-study records, regardless of which course
introduced or reviewed them. A guided step cursor, reading-path proficiency,
reference browsing or sentence-practice score cannot create retention credit.
Shape cards are teaching aids; this view does not enroll them as extra subjects.

“Introduced” does not mean retained. A chapter whose eleven subjects are at
Apprentice shows completed introductions and zero Guru subjects. A lapse can
reduce the current retention count. Burned tracks satisfy retention and are
excluded from due counts.

## Next action

The view chooses an action in this order:

- If any chapter meaning/reading track is due, offer **Review this chapter**.
- Otherwise, if introductions are missing, offer **Open guided chapter**.
- If introductions are complete but retention is still growing, show the next
  future chapter review date and offer optional sentence practice.
- If both skills on every chapter subject are at Guru or above, offer reading
  practice while retaining normal scheduled reviews.

Due counts distinguish questions from subjects. Future review dates are taken
only from the chapter's non-Burned tracks. Time-based counts refresh every ten
seconds while the view is mounted. Guided lessons retain the existing daily
limit and workload checks; this view does not bypass them.

The subject disclosure shows each kanji/word's two skill stages and links to the
association explorer. The guided completion screen displays the same derived
milestones, so finishing 38 lesson steps never claims mastery.

## Scoped scheduled reviews

**Review this chapter** uses the existing scheduled-review player, with a
snapshot of the chapter's canonical subject IDs. The screen labels this scope.

- Select due questions before applying the batch limit; unrelated subjects never
  take a slot.
- The first batch contains up to 20 questions. Subsequent batches retain the scope
  and allow the existing 10/20/40 limits.
- An empty or unknown scope yields an empty batch, never the global queue.
- The existing immediate grading, stale-track checks, interval rules, notes,
  synonyms, level rules and durable history path stay in use.
- Grading receives the full catalog, preserving existing level-gate calculations.
- Pause and explorer navigation preserve the scoped session within the tab.
  Import clears it. Reload closes the batch, as before.
- Ordinary Review/Today/course entries start unscoped batches. A chapter queue
  can be caught up while unrelated due subjects remain in the global queue.

## Persistence and safety

The journey has no new storage format, completion flag or backend field.
Sync/import changes are reflected by deriving a fresh snapshot. Account changes
and loading block the view; missing catalog subjects show an unavailable state.
Browsing, reading and replay do not alter scheduled stages. Actual scheduled
answers use the existing API and history outbox.

## Review guide and validation

- `chapter-progress.ts`: pure milestone, retention and due calculations.
- `chapter-progress.service.ts`: account/loading/catalog guard and saved state.
- `chapter-progress.component.*`: milestones, next action and subject stages.
- Review engine/service/player: scoped candidate selection, restart and next date.
- Study hub/guided player/root: entry points and existing study actions.

Run from frontend:

```sh
npm run test:chapter-progress
npm run test:engines
npm run build
npm run build:demo
```

The progression suite covers empty/introduced/retained states, independent tracks,
lapses, Burned tracks, exact due boundaries, duplicate chapter identities, scoped
20+2 batches, empty/unknown scopes and preservation of unrelated records.

Local verification passed: all 20 frontend engine suites, 23 backend tests, and
production/demo builds (initial bundle about 568 kB, within existing budgets).
Desktop and 390px Chrome against the real API and an isolated H2 database checked
new learners, read-only browsing with identical server state, guided completion
without mastery credit, next-review dates, Burned retention and reading returns.
Chapter review batches of 20 and 2 produced 22 actual scheduled history events.
A subsequent empty chapter batch excluded unrelated due work; the global queue
still exposed it. Lapses survived reload, while outside tracks, notes and the
unlocked level were preserved. No browser runtime errors were reported.
