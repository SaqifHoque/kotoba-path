package com.nihongo.learning.infrastructure.repository;

import com.nihongo.learning.domain.model.*;
import com.nihongo.learning.domain.port.LessonRepository;
import java.util.*;

public final class InMemoryLessonRepository implements LessonRepository {
    private final List<Lesson> lessons = Arrays.asList(
        lesson("r-person", 1, ContentType.RADICAL, "The person radical", "人", "ひと", "person",
            "A simple figure walking on two legs. It often hints that a kanji is connected to people.", rad("人", "person", "Picture two legs walking forward.")),
        lesson("r-sun", 2, ContentType.RADICAL, "The sun radical", "日", "ひ", "sun / day",
            "A window framing the sun. It appears in words about light, time and days.", rad("日", "sun", "The sun is boxed into a bright window.")),
        lesson("k-rest", 3, ContentType.KANJI, "A person rests", "休", "やす・む", "rest",
            "A person leans against a tree. Put the two pictures together: rest.", rad("亻", "person", "A person standing side-on."), rad("木", "tree", "Branches grow from a trunk.")),
        lesson("k-bright", 4, ContentType.KANJI, "Sun and moon", "明", "あか・るい / めい", "bright",
            "The sun and moon combine their light, making everything bright and clear.", rad("日", "sun", "A framed sun."), rad("月", "moon", "A crescent moon with two clouds.")),
        lesson("k-school", 5, ContentType.KANJI, "Learning at school", "学", "まな・ぶ / がく", "study",
            "A child under a decorated roof receives knowledge. You will see 学 in 学生 and 学校.", rad("子", "child", "A child with arms spread."), rad("⺍", "small rays", "Little sparks of knowledge.")),
        lesson("s-rest", 6, ContentType.SENTENCE, "Read your first sentence", "私は休みます。", "わたし は やすみます。", "I rest.",
            "は marks 私 as the topic. 休みます is the polite form of 休む.", rad("亻", "person", "The person clue inside 休."), rad("木", "tree", "The tree supporting the person.")),
        lesson("s-bright", 7, ContentType.SENTENCE, "Describe the morning", "朝は明るいです。", "あさ は あかるい です。", "The morning is bright.",
            "明るい is an い-adjective. です makes the sentence polite.", rad("日", "sun", "Sun brings morning light."), rad("月", "moon", "Moon completes 明.")),
        lesson("p-school", 8, ContentType.PASSAGE, "A small daily story", "私は学生です。朝、学校へ行きます。午後は家で休みます。", "わたし は がくせい です。あさ、がっこう へ いきます。ごご は いえ で やすみます。", "I am a student. In the morning, I go to school. In the afternoon, I rest at home.",
            "You are now combining familiar kanji with particles and polite verbs. Read once with the guide, then once without it.", rad("学", "study", "Knowledge over a child."), rad("休", "rest", "A person by a tree."))
    );

    private static Lesson lesson(String id, int order, ContentType type, String title, String jp, String reading,
                                 String meaning, String explanation, Radical... radicals) {
        return new Lesson(id, order, type, title, jp, reading, meaning, explanation, Arrays.asList(radicals));
    }
    private static Radical rad(String c, String m, String n) { return new Radical(c, m, n); }
    @Override public List<Lesson> findAllOrdered() { return lessons; }
    @Override public Optional<Lesson> findById(String id) { return lessons.stream().filter(l -> l.getId().equals(id)).findFirst(); }
}
