import { STARTER_CHAPTER } from '../chapters/starter-chapter';
import { ReadingCard, ReadingQuestion } from './reading-content';

function question(prompt: string, choices: string[], correct: number, explanation: string): ReadingQuestion {
  return {prompt, choices, correct, explanation};
}
const targets = [
  {text:'人',reading:'ひと'}, {text:'木',reading:'き'}, {text:'休みます',reading:'やすみます'},
  {text:'日',reading:'ひ'}, {text:'月',reading:'つき'}, {text:'休日',reading:'きゅうじつ'}
];
const questions = [
  question('What does the speaker want to know?', ['Where a tree is.', 'Who that person is.', 'What day it is.'], 1, 'だれ means “who”; あの人 means “that person over there.”'),
  question('What is present?', ['A tree.', 'A person.', 'The moon.'], 0, '木 is a tree. あります says that it is there.'),
  question('What will the speaker do today?', ['Work.', 'Go out.', 'Rest.'], 2, '休みます is the polite form of 休む: to rest.'),
  question('What is happening?', ['The moon is visible.', 'The sun is rising.', 'A person is resting.'], 1, '日 here means the sun; のぼります means rises.'),
  question('What can be seen?', ['The moon.', 'A tree.', 'The sun.'], 0, '月 is the moon; みえます means is visible.'),
  question('When is the day off?', ['Today.', 'Yesterday.', 'Tomorrow.'], 2, 'あした means tomorrow. 休日 is a day off.')
];
export const STARTER_READING: readonly ReadingCard[] = [
  ...STARTER_CHAPTER.words.map((word, i) => ({
    id: 'sentence:' + word.id, wordId: word.id, title: 'Sentence ' + (i + 1),
    text: word.sentence.text, kana: word.sentence.reading, meaning: word.sentence.meaning,
    note: word.sentence.note, target: targets[i], questions: [questions[i]]
  })),
  {
    id:'passage:a-little-rest', title:'A little rest',
    text:'きょうは休日です。\n木があります。\nあの人は木のそばで休みます。',
    kana:'きょうはきゅうじつです。\nきがあります。\nあのひとはきのそばでやすみます。',
    meaning:'Today is a day off. There is a tree. That person rests beside the tree.',
    note:'は marks the topic and is pronounced わ. 木のそばで means “beside the tree”; で marks where the action happens. 休みます is the polite form of 休む.',
    questions:[
      question('What kind of day is it?', ['A work day.', 'A day off.', 'A birthday.'], 1, '休日 means a day off. きょう means today.'),
      question('Where does the person rest?', ['Beside the tree.', 'Inside a house.', 'At school.'], 0, '木のそばで means “beside the tree.”')
    ]
  }
];
