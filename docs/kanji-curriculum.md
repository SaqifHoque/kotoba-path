# Kanji curriculum (PR 1 of 3)

This change packages 1,234 kanji for the upcoming learning path. The grouping
function produces 103 levels: 101 levels of 12 kanji and two levels of 11.
Every kanji appears exactly once. The current learning UI is unchanged; review
scheduling and the level-map UI will follow in separate PRs.

The source is `datasets/kanji-alive/ka_data.csv`. Its 1,235 entries include 々,
an iteration mark without an independent reading. That entry remains in the
encyclopedia but is excluded from the kanji recall curriculum.

The deterministic order is school grade, stroke count, then Unicode code point.
These groups are not JLPT levels. Entries include Japanese on/kun readings,
meaning, radical, stroke count, and up to three source vocabulary examples.
The generator does not invent readings or examples. See
`datasets/kanji-alive/LICENSE.md` and `THIRD_PARTY_NOTICES.md` for attribution.

`frontend/src/assets/kanji-curriculum.json` is a generated static asset, served
without a backend API dependency. Consumers can call `buildLevels(cards)` from
`frontend/src/app/features/learn/kanji-curriculum.ts` to obtain numbered levels.

From `frontend` after installing dependencies:

```sh
npm run generate:kanji
npm run test:curriculum
npm run build
```

Regeneration requires a full repository checkout with the source CSV. Docker
builds consume the checked-in generated asset. The tests compare generated data
against the source, verify CSV quoting, count all kanji and level sizes, check
stable ordering, and reject duplicates or catalogs too small for 100 levels.
Keep the source/order stable for published levels; future progress should use
kanji characters as identifiers rather than positions.
