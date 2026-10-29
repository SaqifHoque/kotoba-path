import { ChapterKanji, ChapterShape } from './chapter';

// Original memory aids. These are visual stories, not historical etymologies.
export const STARTER_SHAPES: ChapterShape[] = [
  {
    id: 'shape:person', subjectId: 'k:人', form: '人', name: 'person',
    memory: 'Picture a person standing on two legs. Follow the two strokes down to the ground.'
  },
  {
    id: 'shape:tree', subjectId: 'k:木', form: '木', name: 'tree',
    memory: 'See a trunk, a branch crossing it, and two roots reaching down.'
  },
  {
    id: 'shape:side-person', subjectId: 'k:人', form: '亻', name: 'person at the side',
    memory: 'Squeeze the person shape so it can stand beside another shape. In 休 it appears on the left.'
  },
  {
    id: 'shape:sun', subjectId: 'k:日', form: '日', name: 'sun',
    memory: 'Imagine sunlight framed by a small window, with a line across its middle.'
  },
  {
    id: 'shape:moon', subjectId: 'k:月', form: '月', name: 'moon',
    memory: 'Imagine a tall crescent with two short clouds inside. Notice its open bottom, unlike 日.'
  }
];

export const STARTER_KANJI: ChapterKanji[] = [
  {
    subjectId: 'k:人', meaning: 'person', reading: 'ひと', shapeIds: ['shape:person'],
    memory: 'The two legs belong to one person. Link the whole shape 人 to the idea of a person.',
    readingNote: 'The word 人 is ひと. In compound words this kanji can also be read ジン or ニン; learn each whole word with its reading.'
  },
  {
    subjectId: 'k:木', meaning: 'tree; wood', reading: 'き', shapeIds: ['shape:tree'],
    memory: 'Trace the branches, trunk and roots of a tree. The same character also refers to wood.',
    readingNote: 'The word 木 is き. Compounds may use モク or ボク. A kanji does not have one reading that works in every word.'
  },
  {
    subjectId: 'k:休', meaning: 'rest', reading: 'やすむ · キュウ', shapeIds: ['shape:side-person', 'shape:tree'],
    memory: 'Picture a person leaning beside a tree to rest: 亻 + 木 → 休. Use the scene as a memory aid.',
    readingNote: '休む is やすむ, “to rest.” In 休日, 休 is read キュウ. The む after 休 is kana that helps show the verb form.'
  },
  {
    subjectId: 'k:日', meaning: 'sun; day', reading: 'ひ · ジツ', shapeIds: ['shape:sun'],
    memory: 'A bright sun marks another day. Link both “sun” and “day” to the framed shape 日.',
    readingNote: '日 can be the word ひ, “sun.” In 休日 it is ジツ. Other words use ニチ or different readings; do not guess a word from one reading alone.'
  },
  {
    subjectId: 'k:月', meaning: 'moon; month', reading: 'つき', shapeIds: ['shape:moon'],
    memory: 'Watch the moon change shape through a month. One picture connects “moon” and “month.”',
    readingNote: 'The word 月 is つき, “moon.” Compounds may use ゲツ or ガツ. Here we practise the moon word first.'
  }
];
