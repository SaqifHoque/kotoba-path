package com.nihongo.learning.application;

public interface LearningService {
    LearningPath getPath(String learnerId);
    LearningPath completeLesson(String learnerId, String lessonId);
}
