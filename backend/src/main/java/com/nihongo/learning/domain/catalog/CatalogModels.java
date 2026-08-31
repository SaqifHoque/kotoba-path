package com.nihongo.learning.domain.catalog;

import java.util.List;

public final class CatalogModels {
    private CatalogModels() {}

    public static final class KanjiSummary {
        public final String character, meaning, onyomi, kunyomi, jlptLevel;
        public final int frequencyRank;
        public KanjiSummary(String character, String meaning, String onyomi, String kunyomi, int frequencyRank, String jlptLevel) {
            this.character=character; this.meaning=meaning; this.onyomi=onyomi; this.kunyomi=kunyomi;
            this.frequencyRank=frequencyRank; this.jlptLevel=jlptLevel;
        }
        public String getCharacter(){return character;} public String getMeaning(){return meaning;}
        public String getOnyomi(){return onyomi;} public String getKunyomi(){return kunyomi;}
        public int getFrequencyRank(){return frequencyRank;} public String getJlptLevel(){return jlptLevel;}
    }
    public static final class ComponentView {
        public final String character, meaning, imageFilename;
        public ComponentView(String character,String meaning,String imageFilename){this.character=character;this.meaning=meaning;this.imageFilename=imageFilename;}
        public String getCharacter(){return character;} public String getMeaning(){return meaning;} public String getImageFilename(){return imageFilename;}
    }
    public static final class WordView {
        public final String expression, reading, meaning, contribution; public final Integer frequencyRank;
        public WordView(String expression,String reading,String meaning,Integer frequencyRank,String contribution){this.expression=expression;this.reading=reading;this.meaning=meaning;this.frequencyRank=frequencyRank;this.contribution=contribution;}
        public String getExpression(){return expression;} public String getReading(){return reading;} public String getMeaning(){return meaning;}
        public Integer getFrequencyRank(){return frequencyRank;} public String getContribution(){return contribution;}
    }
    public static final class SentenceView {
        public final String japanese, reading, english, sourceName;
        public SentenceView(String japanese,String reading,String english,String sourceName){this.japanese=japanese;this.reading=reading;this.english=english;this.sourceName=sourceName;}
        public String getJapanese(){return japanese;} public String getReading(){return reading;} public String getEnglish(){return english;} public String getSourceName(){return sourceName;}
    }
    public static final class KanjiDetail {
        public final KanjiSummary kanji; public final String mnemonic, primaryRadical; public final boolean jlptEstimated;
        public final List<ComponentView> components; public final List<WordView> words; public final List<SentenceView> sentences; public final List<KanjiSummary> related;
        public KanjiDetail(KanjiSummary kanji,String mnemonic,String primaryRadical,boolean jlptEstimated,List<ComponentView> components,List<WordView> words,List<SentenceView> sentences,List<KanjiSummary> related){this.kanji=kanji;this.mnemonic=mnemonic;this.primaryRadical=primaryRadical;this.jlptEstimated=jlptEstimated;this.components=components;this.words=words;this.sentences=sentences;this.related=related;}
        public KanjiSummary getKanji(){return kanji;} public String getMnemonic(){return mnemonic;} public String getPrimaryRadical(){return primaryRadical;}
        public boolean isJlptEstimated(){return jlptEstimated;} public List<ComponentView> getComponents(){return components;} public List<WordView> getWords(){return words;} public List<SentenceView> getSentences(){return sentences;} public List<KanjiSummary> getRelated(){return related;}
    }
    public static final class RadicalDetail {
        public final String character,nameJapanese,nameRomaji,meaning,positionName,imageFilename; public final Integer strokeCount; public final List<KanjiSummary> kanji;
        public RadicalDetail(String character,String nameJapanese,String nameRomaji,String meaning,Integer strokeCount,String positionName,String imageFilename,List<KanjiSummary> kanji){this.character=character;this.nameJapanese=nameJapanese;this.nameRomaji=nameRomaji;this.meaning=meaning;this.strokeCount=strokeCount;this.positionName=positionName;this.imageFilename=imageFilename;this.kanji=kanji;}
        public String getCharacter(){return character;} public String getNameJapanese(){return nameJapanese;} public String getNameRomaji(){return nameRomaji;} public String getMeaning(){return meaning;} public Integer getStrokeCount(){return strokeCount;} public String getPositionName(){return positionName;} public String getImageFilename(){return imageFilename;} public List<KanjiSummary> getKanji(){return kanji;}
    }
    public static final class ReadingToken {
        public final String text; public final boolean kanji; public final boolean known;
        public ReadingToken(String text,boolean kanji,boolean known){this.text=text;this.kanji=kanji;this.known=known;}
        public String getText(){return text;} public boolean isKanji(){return kanji;} public boolean isKnown(){return known;}
    }
}
