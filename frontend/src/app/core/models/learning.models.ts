export type ContentType = 'RADICAL' | 'KANJI' | 'SENTENCE' | 'PASSAGE';
export interface Radical { character: string; meaning: string; mnemonic: string; }
export interface Lesson { id: string; order: number; type: ContentType; title: string; japanese: string; reading: string; meaning: string; explanation: string; radicals: Radical[]; }
export interface LearningProgress { learnerId: string; completedLessonIds: string[]; }
export interface LearningPath { lessons: Lesson[]; progress: LearningProgress; nextLessonId: string | null; }
