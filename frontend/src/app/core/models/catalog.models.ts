export interface KanjiSummary { character:string; meaning:string; onyomi:string; kunyomi:string; frequencyRank:number; jlptLevel:string; }
export interface ComponentView { character:string; meaning:string; imageFilename?:string; }
export interface WordView { expression:string; reading:string; meaning:string; frequencyRank?:number; contribution:string; }
export interface SentenceView { japanese:string; reading:string; english:string; sourceName:string; }
export interface KanjiDetail { kanji:KanjiSummary; mnemonic:string; primaryRadical:string; jlptEstimated:boolean; components:ComponentView[]; words:WordView[]; sentences:SentenceView[]; related:KanjiSummary[]; }
export interface RadicalDetail { character:string; nameJapanese:string; nameRomaji:string; meaning:string; strokeCount:number; positionName:string; imageFilename?:string; kanji:KanjiSummary[]; }
export interface CatalogPage { items:KanjiSummary[]; total:number; page:number; size:number; }
export interface ReadingToken { text:string; kanji:boolean; known:boolean; }
