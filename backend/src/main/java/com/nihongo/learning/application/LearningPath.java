package com.nihongo.learning.application;

import com.nihongo.learning.domain.model.LearningProgress;
import com.nihongo.learning.domain.model.Lesson;
import java.util.List;

public final class LearningPath {
    private final List<Lesson> lessons;
    private final LearningProgress progress;
    private final String nextLessonId;

    public LearningPath(List<Lesson> lessons, LearningProgress progress, String nextLessonId) {
        this.lessons = lessons; this.progress = progress; this.nextLessonId = nextLessonId;
    }
    public List<Lesson> getLessons() { return lessons; }
    public LearningProgress getProgress() { return progress; }
    public String getNextLessonId() { return nextLessonId; }
}
