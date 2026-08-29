package com.nihongo.learning.domain.model;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public final class Lesson {
    private final String id;
    private final int order;
    private final ContentType type;
    private final String title;
    private final String japanese;
    private final String reading;
    private final String meaning;
    private final String explanation;
    private final List<Radical> radicals;

    public Lesson(String id, int order, ContentType type, String title, String japanese, String reading,
                  String meaning, String explanation, List<Radical> radicals) {
        this.id = Objects.requireNonNull(id); this.order = order; this.type = Objects.requireNonNull(type);
        this.title = Objects.requireNonNull(title); this.japanese = Objects.requireNonNull(japanese);
        this.reading = Objects.requireNonNull(reading); this.meaning = Objects.requireNonNull(meaning);
        this.explanation = Objects.requireNonNull(explanation);
        this.radicals = Collections.unmodifiableList(radicals == null ? Collections.emptyList() : radicals);
    }
    public String getId() { return id; }
    public int getOrder() { return order; }
    public ContentType getType() { return type; }
    public String getTitle() { return title; }
    public String getJapanese() { return japanese; }
    public String getReading() { return reading; }
    public String getMeaning() { return meaning; }
    public String getExplanation() { return explanation; }
    public List<Radical> getRadicals() { return radicals; }
}
