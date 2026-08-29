package com.nihongo.learning.domain.model;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public final class LearningProgress {
    private final String learnerId;
    private final Set<String> completedLessonIds;

    public LearningProgress(String learnerId, Set<String> completedLessonIds) {
        this.learnerId = learnerId;
        this.completedLessonIds = new HashSet<>(completedLessonIds);
    }
    public String getLearnerId() { return learnerId; }
    public Set<String> getCompletedLessonIds() { return Collections.unmodifiableSet(completedLessonIds); }
    public LearningProgress complete(String lessonId) {
        Set<String> next = new HashSet<>(completedLessonIds); next.add(lessonId);
        return new LearningProgress(learnerId, next);
    }
}
