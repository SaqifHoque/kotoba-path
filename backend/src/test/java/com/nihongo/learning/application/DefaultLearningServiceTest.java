package com.nihongo.learning.application;

import com.nihongo.learning.infrastructure.repository.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DefaultLearningServiceTest {
    private final DefaultLearningService service = new DefaultLearningService(
        new InMemoryLessonRepository(), new InMemoryProgressRepository());

    @Test void progressesInCurriculumOrder() {
        assertEquals("r-person", service.getPath("learner").getNextLessonId());
        assertEquals("r-sun", service.completeLesson("learner", "r-person").getNextLessonId());
    }

    @Test void preventsSkippingAhead() {
        assertThrows(LessonLockedException.class, () -> service.completeLesson("learner", "k-rest"));
    }
}
