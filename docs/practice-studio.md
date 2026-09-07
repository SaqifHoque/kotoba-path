# Contextual vocabulary and reading practice

Open **Words & reading** from the learning path. This module focuses on kanji recognition and reading; it does not include audio, microphone recording, shadowing, or handwriting.

## Vocabulary progression

The curriculum's source examples produce 3,349 unique vocabulary entries. Words unlock when their prerequisite kanji are learned or are explicitly treated as assumed foundations by the learner's proficiency profile. Unknown prerequisites keep a word locked.

New vocabulary is ordered near the learner's selected N5–N1 starting band. Previously studied vocabulary remains eligible for review even when that selection changes. Thirty-four short contexts provide sentence-level reading practice, while other entries retain their source dictionary meanings.

## Practice modes

- **Vocabulary** asks for whole-word readings in kana.
- **Mixed practice** interleaves up to ten due kanji with up to ten vocabulary reading or meaning prompts.
- Incorrect typed readings can only receive **Again**. Katakana equivalents and source-listed alternative readings are accepted.
- Review intervals use the same Again, Hard, and Good schedule as kanji practice.

Vocabulary review progress is stored independently from kanji progress in both the database profile and browser cache. Importing a backup merges higher-attempt records instead of erasing newer reviews.

## Validation

Run `npm run test:practice`, `npm run test:kanji`, `npm run test:sync`, and `npm run build` from `frontend`. Backend Maven tests verify vocabulary persistence, stale-revision protection, malformed payload rejection, and compatibility with clients that omit vocabulary.
