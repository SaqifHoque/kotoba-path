# Kanji path and repetition

The learning screen uses 1,234 kanji from the bundled Kanji Alive catalog across
103 sequential levels: 101 levels of 12 kanji and two levels of 11. The source
also includes 々 (the iteration mark); it stays in the encyclopedia but is
excluded from recall levels because it has no independent reading.

Kanji are ordered by school grade, stroke count, then Unicode code point. These
are learning groups, not validated JLPT levels. Each card shows source readings,
meaning, radical, and up to three source vocabulary examples after reveal.

Learners self-assess meaning and reading recall. Hard or Good introduces a card;
all cards must be introduced before the next level opens. Again repeats a new
card within the learning session. Clearing a level does not mean permanent
mastery. Completed levels can be practised without changing scheduled dates.

Repetition sessions include up to 20 due cards, oldest due first. Good advances
through 1, 3, 7, 14, 30, 60, 120 days, then stays at 120 days. Hard returns in one
day and reduces the stage; Again returns in ten minutes and resets the interval.
A failed review does not relock later levels. The timer refreshes due counts
every ten seconds while the app is open. There are no background notifications.
This is a simple interval scheduler, not a calibrated prediction of retention.

Progress is browser-local under `kotoba-kanji-reviews-v1`, keyed by character,
with JSON export/restore. No account/server sync is implemented. Restore merges
valid cards by attempt count; it does not erase existing progress. The earlier
eight-lesson completion key and backend demo APIs are untouched: those flags do
not establish recall of the full kanji curriculum. Corrupt saved data is not
overwritten automatically, and storage failures are shown to the learner.

The catalog is packaged as a static JSON asset so studying and reviewing do not
require the backend. Loading the application/catalog still requires the site;
there is no service-worker offline cache. Attribution: `datasets/kanji-alive/LICENSE.md`.

## Validation and regeneration

From `frontend`, run `npm run test:kanji` and `npm run build`.
Run `npm run generate:kanji` from a full repository checkout to rebuild the asset
from `datasets/kanji-alive/ka_data.csv`. Commit the generated JSON with any source
updates. Keep ordering stable for existing learners; stored review data uses
characters rather than level positions.

## Next learning improvements

These are proposals, not implemented features, and do not guarantee faster learning.

- Add separate typed meaning and reading recall with accepted-answer variants;
  keep vocabulary alongside kanji so readings are learned in context. WaniKani
  provides a useful reference for radical → kanji → vocabulary progression:
  https://knowledge.wanikani.com/getting-started/unlocking-kanji/
- Mix short reading/listening exercises and review into the path. Duolingo's
  guided path explicitly includes practice and stories:
  https://blog.duolingo.com/new-duolingo-home-screen-design/
- Add licensed native-speaker audio, short clips, and shadowing for the current
  vocabulary. Memrise's word lists pair repetition with recordings and examples:
  https://explore.memrise.com/community-courses
- Add kana drills, common grammar patterns, and similar-looking kanji practice
  selected from the learner's mistakes. Track delayed recall accuracy rather
  than treating a cleared level as proof of mastery.
- Add account-backed progress sync and optional review reminders before adding
  competitive streaks or leaderboards.
