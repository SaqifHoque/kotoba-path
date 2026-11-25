# Focused mistake practice

After finishing or closing a scheduled typed-review batch, **Practise these
mistakes** opens a correction session containing only its scored incorrect
questions. Correct, skipped and unanswered questions are excluded.

Meaning and reading are separate questions. Duplicate subject/skill pairs are
removed; missing catalog subjects and unsupported reading questions are excluded.
The player uses current canonical catalog content rather than treating an old
accepted-answer string as the source definition.

## Practice and scheduled evidence

This is tab-local recall practice. It does not update stages, due dates, notes,
lesson records, unlocked levels, history/outbox events, quests or badges.
Original scheduled outcomes and their saved next-review dates remain intact.

The existing answer checker accepts current personal meaning synonyms and
normalizes kana. Wrong-script/other-listed-reading retries stay unscored within
practice. Each question retains its first actual practice result; checking twice
does not overwrite it. Reveal records an incorrect practice answer and shows
accepted answers.

Continue requires a result. Finish for now retains actual answered/correct/
incorrect counts and reports unanswered questions separately. Repeat resets the
local round for the same mistake questions, rather than changing original scores.

## Support and audio

Before answering, the player shows the Japanese subject and which skill to
recall. Accepted answers, meaning/context, saved personal notes, explorer lookup
and vocabulary audio appear only after checking or revealing an answer.
Unscored format retries do not expose those controls.

Existing Japanese device/browser word audio stops on question changes, finish,
restart and navigation. This PR adds no audio provider or recording.

## Resume and isolation

Pause returns to typed reviews. Reopening practice from the same unfinished
source batch resumes its draft/results. Review open sessions and Today can also
resume it. Explorer return preserves the practice result.

A practice session belongs to the account that started it. Loading/account
changes block actions; a confirmed progress import clears the session. Reload
closes practice while already recorded scheduled answers remain saved.

Starting practice from a different completed batch replaces the old correction
session. Return to typed reviews opens the current typed-review session, which
may differ if another batch was started in the meantime. No persistent resume
key or progress-file field is added.

## Review guide and validation

- `mistake-practice.ts`: pure selection, first-answer grading, transitions and
  summaries.
- Service: account guard, same-source resume and transient state; no sync writes.
- Player: typed prompts, post-answer support, pause and honest results.
- Review/root navigation: summary launch, open sessions, explorer return and import
  reset.

Run from frontend:

```sh
npm run test:mistake-practice
npm run test:engines
npm run build
npm run build:demo
```

All 25 frontend engine suites, 32 existing backend tests and production/demo
builds passed locally (initial bundle about 618 kB, within existing budgets).
Pure tests cover mistake-only selection, skill deduplication, missing/unsupported
subjects, canonical answers, personal meanings, kana retries, first-answer
immutability, early finish and unchanged source/catalog data.

Desktop and 390px Chrome → real API → isolated H2 verified a four-question source
batch with three mistakes, correction selection, summary/hub pause-resume, personal
meaning acceptance, kana retry, audio/support gates, explorer return, repeat and
early finish. Server state, history and device storage remained exactly identical
through practice. The scheduled summary still showed its original results.

Import reset, a partially finished source batch, mobile keyboard/audio controls,
reload closure and persisted scheduled records/history also passed. No horizontal
overflow or browser runtime errors occurred. Backend source/schema is unchanged.
