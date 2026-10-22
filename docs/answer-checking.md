# Answer checking and personal meaning synonyms

Forge meaning checks accept the catalog’s alternatives, six small original alias sets, and your personal synonyms. Matching normalizes case, Unicode width, articles, leading “to,” known part-of-speech tags, hyphens, and spacing. Alternatives split outside annotations; arbitrary text in a typed parenthesis is not discarded. Spelling remains exact. There is no fuzzy or AI grading.

The curated additions are 大 → large, 小 → little, 人 → human, 休 → take a rest, 見 → look / look at, and 車 → automobile. These are English additions to the existing catalog, not WaniKani’s answer list.

## Personal meanings

Open **Personal meaning synonyms** while studying a Forge meaning lesson or after checking a meaning answer. Enter one English synonym per line, up to eight per subject and 80 characters each. Save an empty list to remove them. Saved changes apply to future checks; adding a synonym never changes the result already shown. Reading checks always use the listed kana readings. Path meanings remain self-assessed.

Synonyms can be saved before introducing an item. They sync with the active guest/account profile, migrate when a guest registers, and travel in Forge JSON backups. Saving or removing synonyms does not introduce a subject, advance mastery, award XP, change review dates, or record a review attempt.

## Reading and wrong-field guidance

Reading checks in Forge and Words & reading accept equivalent hiragana, katakana, and half-width kana. Small kana, long vowels, and whole-word kana endings still matter.

Japanese input in a Forge meaning check, non-kana input in a reading check, or another listed non-target kanji reading prompts a retry on the same question. These inputs are not scored and cannot advance the session. Wrong kana and **I don’t know** are incorrect answers. Forge records scheduled results on **Continue**; Words & reading records a result when a rating is chosen, and an incorrect reading only allows **Again**. Extra Forge practice continues to leave mastery unchanged.

## Persistence and compatibility

`forge.meaningSynonyms` is an optional map keyed by subject ID. Each entry contains `values` and an integer millisecond `updatedAt`. Old backups default to an empty map. Empty values are removal tombstones; merging preserves them against stale snapshots. Newer timestamps win independently from mastery, notes, and settings. Equal-time deletion wins; other equal-time ties use a deterministic UTF-16 comparison of sorted values joined with NUL.

The API merges preferences under the existing profile row lock and optimistic revision check. Clients that omit the field cannot erase it. Input and merged maps are bounded to 6,000 entries; timestamps are bounded by JavaScript’s supported date range. No database migration is required.

Run `npm run test:engines` and `npm run build` from `frontend`, and `mvn verify` from `backend`. The answer suite covers exact acceptance, annotations, wrong-field retries, kana distinctions, personal meanings, backup compatibility, and deterministic removals. API tests cover validation, old clients, stale snapshots, account migration, and profile isolation.
