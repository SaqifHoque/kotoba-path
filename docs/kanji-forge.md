# Kanji Forge

Open **Kanji Forge** in the sidebar. This optional mode has its own curriculum state, lesson limit, meaning/reading tracks, mnemonic notes, and backup. It does not alter the existing learning path, proficiency selection, or its review history. There is no audio or handwriting.

## Progression

- Uses all 1,234 kanji in the existing 103-level allocation, their primary radicals, and vocabulary whose kanji prerequisites all exist in the catalog. Radical variants are normalized where Unicode provides an equivalent. Existing SVG artwork renders private-use radical glyphs.
- Starts at Forge level 1; the regular path's N3/N2 starting point is not interpreted as demonstrated Forge mastery.
- A lesson presents meanings, the accepted reading, and a mnemonic prompt. All recall checks must pass before the item is introduced at Apprentice I. Leaving midway does not introduce it.
- Primary radicals reaching Guru unlock their kanji. All constituent kanji must reach Guru to unlock a vocabulary lesson. Kanji and vocabulary track meaning and reading independently; the weaker track determines overall mastery.
- At least 90% of the current level's kanji must reach Guru to unlock the next level. Unlocked levels never relock after later mistakes.
- Stages: Apprentice I–IV, Guru I–II, Master, Enlightened, Burned. Waits after each stage are 4h, 8h, 1d, 2d, 7d, 14d, 30d, 120d. Burned tracks have no scheduled review date. A wrong answer drops one Apprentice stage or two stages from Guru onward, never below Apprentice I.
- Extra practice does not change mastery, reviews, or XP. Scheduled questions cannot advance before their due time or be submitted twice for the same due review.

## Learning tools and motivation

Daily new-item limits are 5, 10, or 20, counted by the browser's local calendar date. Lesson batches contain up to five subjects. The workload guard pauses new lessons at 50 Apprentice subjects or 20 due questions. Review batches contain up to 40 questions.

The dashboard shows stage counts, scheduled-review accuracy, next review time, milestone progress, and recall XP (five per introduced subject and ten per correct scheduled answer). First Spark, Ten Tempered, and First Flame badges reward introduction, Guru-level retention, and the first Burned item.

The trouble-item workshop selects tracks with at least three mistakes and less than 80% accuracy. A curated visual comparison workshop covers common groups such as 日/目/白, 土/士, 未/末, and 人/入. Explanations appear after answering. Personal mnemonic notes are limited to 1,000 characters and saved with the subject. Source meanings are matched against normalized comma/semicolon/slash alternatives; kana checks accept equivalent katakana and listed variants. This is strict answer checking, not semantic AI grading.

## Persistence and compatibility

Forge is stored as a separate `forge` object in the existing database profile JSON and cached under `kotoba-forge-v1`. It includes independently versioned review tracks, unlocked level, settings, notes, and timestamps. Conflict merges preserve the more-reviewed track and newer notes/settings. Review counts are snapshots, not a full review-event log.

Older clients that omit Forge in a profile update cannot erase saved Forge data. Existing profile rows need no schema change. JSON backup import validates records and merges without resetting other modes. Database profiles still use the existing browser cookie; account-based cross-device identity is not provided.

## Sources and scope

Inspired by [WaniKani's stages](https://knowledge.wanikani.com/wanikani/srs-stages/) and [Guru-based unlocks](https://knowledge.wanikani.com/getting-started/unlocking-kanji/). This is an independent implementation: separate skill clocks, workload limits, XP, and the 103-level catalog are this app's choices. It does not reproduce WaniKani's proprietary subject ordering, authored mnemonic library, accelerated early-level timings, or exact multi-error scoring. Radicals use the catalog's primary classification rather than claiming exhaustive decomposition.

Kanji, meanings, readings, examples, and radical artwork come from the project's licensed Kanji Alive dataset. Memory prompts are original learning aids, not etymological claims.

## Validation

Run `npm run test:forge`, `npm run test:kanji`, `npm run test:practice`, and `npm run build` from frontend, and Maven tests from backend. Tests cover prerequisite coverage, separate skills, due-only advancement, Guru gates, the 90% threshold, mistakes, Burned exclusion, lesson limits, backup validation, database round trips, and older-client compatibility. Browser checks cover lesson retries, notes, module isolation, practice without progress inflation, database recovery, Guru unlocks, backups, SVG rendering, and mobile overflow.
