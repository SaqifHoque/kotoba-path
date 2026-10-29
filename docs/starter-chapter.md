# Starter chapter: People, trees & a little rest

Feature 4 of the learning redesign provides one complete authored chapter,
accessible from **Learn** and **Library**. The collapsed chapter keeps the existing
lesson action easy to find; expanding it reveals the full teaching sequence.

## Learning sequence

1. Five visual shape aids: person 人, tree 木, side-person 亻, sun 日 and moon 月.
2. Five kanji: 人, 木, 休, 日 and 月. Person and tree appear before their association
   in 休. Shape links are teaching relationships, independent of SRS prerequisites.
3. Six whole words: 人（ひと）, 木（き）, 休む（やすむ）, 日（ひ）, 月（つき） and
   休日（きゅうじつ）. Each has a meaning, reading explanation and short sentence.
4. Eleven self-check prompts cover every kanji and word. Answers are closed until
   the learner opens them. They do not award completion or review credit.

Sentences include kana guides, translations and explanations of the extra kana
vocabulary/grammar. No sentence introduces an untaught kanji. The 休む example
explains its polite form 休みます rather than treating the two forms as identical.
The compound 休日 demonstrates that a kanji can have different readings in words.
The reading guides use kana; hiragana familiarity helps with reading practice.

The written explanations, sentences and visual memory stories are original
content for Kotoba Path. The shape stories are mnemonic choices. They do not
assert historical etymology, and kanji readings are taught in word context.
Existing Kanji Alive catalog attribution remains unchanged.

## Content and identity contract

`features/chapters/chapter.ts` defines the typed, versioned authoring format.
`starter-kanji.ts` contains shapes/kanji; `starter-chapter.ts` contains the chapter
introduction, words, sentences and recall prompts. Keeping the authored data
separate from Angular lets a later guided player use the same content.

The chapter ID is `chapter:people-trees-and-rest`, version `1.0.0`. Kanji references
reuse published `k:` identities. Words have explicit `v:` IDs, including the
existing `v:休日:きゅうじつ`. The other five word IDs are reserved in this chapter.
There is no new enrollment, catalog level or persisted chapter-progress format.
Do not regenerate IDs from edited display text. Bump the chapter version when
changing its content and retain IDs for the same subjects.

`validateChapter` checks unique identities, teaching order, catalog references,
consistency with published components, word-kanji coverage, reused published
word IDs, kana readings, supported sentence kanji and recall coverage. A chapter
that does not validate shows an availability message; the existing courses
remain available. Validation runs in CI and when the chapter view receives cards.
It validates our compiled authored content, not arbitrary imported files.

## Progress and scope

Browsing, reading toggles, word-to-kanji links and answer disclosure do not write
study progress or enqueue history. Existing kanji/vocabulary/Forge IDs, lesson
eligibility, review dates, notes, backups and account behavior are unchanged.
The five chapter-only words do not enter legacy lesson queues automatically.

The next feature is the guided lesson player. It must explicitly define how
chapter subjects enter reviews, preserve existing records (especially the already
published 休日), support resume, and distinguish introduction from scheduled
mastery. Chapter rewards, broader progression, audio and gamification remain
separate roadmap features.

## Verification

From `frontend`:

```sh
npm run test:chapters
npm run test:engines
npm run build
npm run build:demo
```

The chapter suite checks the published content, teaching order, identity reuse,
word readings, sentence support, full recall coverage, invalid variants and
unchanged legacy lesson eligibility. It is included in existing frontend CI.

Browser verification on the production demo covers:

- Learn and Library entry points; the full five-kanji/six-word content.
- Keyboard opening of the chapter and recall answers.
- Hiding/showing ruby readings and sentence guides.
- Word links returning to the relevant kanji card.
- Desktop and 390px mobile layouts without horizontal page scrolling.
- Unchanged saved progress and review-outbox storage after browsing.
- Existing typed lessons still starting normally after leaving the chapter.

There are no backend endpoints, database migrations or new dependencies in this PR.
