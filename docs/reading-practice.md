# Sentence and reading practice

Feature 9 adds a bridge from recognizing a word to understanding it in context.
Open **Read Japanese in context** in Learn or Library. The starter chapter's word
cards and guided word-study cards also offer **Practise this sentence**.

## Content and flow

The full practice contains six existing starter sentences, followed by an original
three-line passage, “A little rest.” It uses only the starter chapter's five kanji.
Each sentence asks for the highlighted surface form's kana reading, then one
multiple-choice comprehension answer. The passage has two comprehension questions.

A reading target follows the sentence form: **休みます → やすみます**, while its
lookup links to the canonical **休む** word. Kana input uses the shared reading
checker, including katakana normalization and unscored wrong-script retries.
Reveal reading records an incorrect practice answer. Answers are first-attempt
results; clicking again cannot overwrite them.

The passage translation is disclosed after both questions are answered, or when
the learner explicitly chooses Show meaning. Feedback for the first question
does not reveal the second answer. This is authored comprehension practice, not
automatic grading of arbitrary translations.

## Help and results

Kana, meaning, grammar and word lookup are optional. Each records support for
subsequent answers in that part. The result snapshots whether support had been
used when the answer was given; looking something up afterward does not rewrite
an earlier result. Support continues across both passage questions.

Summaries show completed parts, answered/correct word readings, correct readings
without support, answered/correct comprehension, supported comprehension answers
and unanswered questions. Finishing early never invents results.

Audio appears only after the word reading is checked or revealed, and speaks the
actual sentence target through the existing Japanese browser/device speech
feature. It stops on navigation or question transitions.

## Session and progress boundaries

- A full practice is seven parts (six sentences and one passage); a contextual
  launch is one sentence. Starting another explicit sentence replaces the
  current reading session.
- Learn/Library entry resumes an unfinished reading session. Today and the open
  sessions list can also resume it.
- Drafts, answers and support flags survive navigation within the tab. Word
  lookup returns to the same reading state.
- Returning from a guided word card preserves its guided lesson step.
- Results are tab-local. Reload closes practice; it creates no persistent resume
  record. Imported learning data clears the session. Account/loading guards block
  access to another account's transient session.
- Practice does not introduce SRS subjects, change stages or due dates, award
  scheduled-review credit, write history/outbox events, or change exported data.

## Authoring and validation

Content is compiled TypeScript, reusing starter sentence text, kana, translation,
grammar notes and canonical word IDs. Validation rejects duplicate/empty IDs,
unknown words, changed source sentences, untaught kanji, invalid kana guides,
missing/ambiguous surface targets, unsupported target readings, empty content and
invalid multiple-choice answers. Passage questions use indexes scoped to their
card, with bounded unique choices.

Keep new material authored and reviewed. Extending the story beyond the starter
kanji needs an explicit content/teaching decision; browsing does not infer mastery.

## Verification

Run `npm run test:reading`, `npm run test:engines`, `npm run build` and
`npm run build:demo` from frontend. The reading suite covers conjugated forms,
kana retries, immutable first answers, support snapshots, ordered passage
questions, invalid content, single-sentence sessions and unfinished summaries.

Browser checks cover full sentence/story practice, support counts, hidden passage
translation, feedback focus, keyboard answers, pause/resume, word lookup return,
guided-step preservation, early finish, reload and 390px layout. Compare local
storage before/after, including an existing pending history event. No backend or
database changes are needed for this feature.
