import { StudyChapter } from './chapter';
import { STARTER_KANJI, STARTER_SHAPES } from './starter-kanji';

/** Stable chapter/word IDs are reserved here; browsing does not enroll these words in SRS. */
export const STARTER_CHAPTER: StudyChapter = {
  schemaVersion: 1,
  id: 'chapter:people-trees-and-rest',
  version: '1.0.0',
  title: 'People, trees & a little rest',
  description: 'Turn a few familiar shapes into five kanji, then read six useful words in short sentences.',
  goals: [
    'Recognize 人, 木, 休, 日 and 月, and connect each shape to its meaning.',
    'See how the side-person shape and tree combine in 休.',
    'Read words as whole words, including the different readings in 休む and 休日.'
  ],
  shapes: STARTER_SHAPES,
  kanji: STARTER_KANJI,
  words: [
    {
      id: 'v:人:ひと', text: '人', reading: 'ひと', meaning: 'person', kanjiIds: ['k:人'],
      readingNote: 'This standalone word uses ひと. Keep the reading attached to the word, not to every occurrence of 人.',
      sentence: {
        text: 'あの人はだれですか。', reading: 'あのひとはだれですか。', meaning: 'Who is that person?',
        note: 'あの means “that … over there.” は marks the topic and is pronounced わ. だれ means “who,” and ですか makes this a polite question.'
      }
    },
    {
      id: 'v:木:き', text: '木', reading: 'き', meaning: 'tree; wood', kanjiIds: ['k:木'],
      readingNote: 'Read the whole word 木 as き. In this sentence it means a living tree.',
      sentence: {
        text: '木があります。', reading: 'きがあります。', meaning: 'There is a tree.',
        note: 'が marks the thing that is present. あります expresses that something exists; trees use あります here.'
      }
    },
    {
      id: 'v:休む:やすむ', text: '休む', reading: 'やすむ', meaning: 'to rest; to take a break', kanjiIds: ['k:休'],
      readingNote: 'The kanji carries やす and the kana む completes the dictionary form やすむ. The polite form in the sentence is 休みます（やすみます）.',
      sentence: {
        text: 'きょうは休みます。', reading: 'きょうはやすみます。', meaning: 'I will rest today.',
        note: 'きょう means “today.” は is pronounced わ. Japanese often leaves “I” unstated when the speaker is understood. 休みます is the polite form of 休む.'
      }
    },
    {
      id: 'v:日:ひ', text: '日', reading: 'ひ', meaning: 'sun', kanjiIds: ['k:日'],
      readingNote: 'Here 日 means the sun and is read ひ. Its “day” meaning appears in the next compound word.',
      sentence: {
        text: '日がのぼります。', reading: 'ひがのぼります。', meaning: 'The sun rises.',
        note: 'が marks what rises. のぼります is the polite form of のぼる, “to rise” or “to climb.”'
      }
    },
    {
      id: 'v:月:つき', text: '月', reading: 'つき', meaning: 'moon', kanjiIds: ['k:月'],
      readingNote: 'Use つき for the moon word in this sentence. Month names and compounds have other readings.',
      sentence: {
        text: '月がみえます。', reading: 'つきがみえます。', meaning: 'The moon is visible.',
        note: 'が marks what can be seen. みえます means “is visible” or “can be seen”; this sentence does not need a separate word for “I.”'
      }
    },
    {
      id: 'v:休日:きゅうじつ', text: '休日', reading: 'きゅうじつ', meaning: 'day off; holiday', kanjiIds: ['k:休', 'k:日'],
      readingNote: 'A rest-day is きゅうじつ: 休 contributes キュウ and 日 contributes ジツ. Learn that complete sound with the word; やすひ is not its reading.',
      sentence: {
        text: 'あしたは休日です。', reading: 'あしたはきゅうじつです。', meaning: 'Tomorrow is a day off.',
        note: 'あした means “tomorrow.” は is pronounced わ. です makes a polite statement. A 休日 is a day off; it need not be a national public holiday.'
      }
    }
  ],
  recall: [
    {
      id: 'recall:person-shape', prompt: 'Which kanji looks like a person standing on two legs?', answer: '人 — person',
      explanation: 'Use the two strokes as a visual cue for a person.', subjectIds: ['k:人']
    },
    {
      id: 'recall:tree-shape', prompt: 'Which kanji has a trunk with branches and roots?', answer: '木 — tree; wood',
      explanation: 'Connect the shape to both the living tree and its wood.', subjectIds: ['k:木']
    },
    {
      id: 'recall:rest-association', prompt: 'A side-person 亻 leans beside 木. Which kanji and meaning does that help you remember?', answer: '休 — rest',
      explanation: '亻 + 木 → 休 is a visual memory story, not a claim about the historical origin of the character.', subjectIds: ['k:休']
    },
    {
      id: 'recall:sun-shape', prompt: 'Which kanji in this chapter connects the sun with a day?', answer: '日 — sun; day',
      explanation: 'Notice its closed frame and the line through its middle.', subjectIds: ['k:日']
    },
    {
      id: 'recall:moon-shape', prompt: 'Which kanji connects the moon with a month?', answer: '月 — moon; month',
      explanation: 'Distinguish its tall shape and two inner strokes from 日.', subjectIds: ['k:月']
    },
    {
      id: 'recall:person-word', prompt: 'Read 人 as the standalone word meaning “person.”', answer: 'ひと',
      explanation: 'In あの人, the whole word 人 is ひと. Compound words can use other readings.', subjectIds: ['v:人:ひと']
    },
    {
      id: 'recall:tree-word', prompt: 'Read 木 in 木があります。', answer: 'き — tree',
      explanation: 'The sentence reads きがあります: “There is a tree.”', subjectIds: ['v:木:き']
    },
    {
      id: 'recall:rest-word', prompt: 'Read the dictionary form 休む. What does it mean?', answer: 'やすむ — to rest; to take a break',
      explanation: 'Keep the kana む. The polite form is 休みます（やすみます）.', subjectIds: ['v:休む:やすむ']
    },
    {
      id: 'recall:sun-word', prompt: 'Read 日 when it is the word for the sun.', answer: 'ひ',
      explanation: '日がのぼります reads ひがのぼります: “The sun rises.”', subjectIds: ['v:日:ひ']
    },
    {
      id: 'recall:moon-word', prompt: 'Read 月 as the standalone word meaning “moon.”', answer: 'つき',
      explanation: '月がみえます reads つきがみえます: “The moon is visible.”', subjectIds: ['v:月:つき']
    },
    {
      id: 'recall:day-off-word', prompt: 'Combine rest + day: read 休日 and explain its meaning.', answer: 'きゅうじつ — day off; holiday',
      explanation: 'The compound uses キュウ + ジツ. It has its own whole-word reading.', subjectIds: ['v:休日:きゅうじつ']
    }
  ]
};
