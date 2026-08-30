package com.nihongo.learning.application;

import com.nihongo.learning.domain.model.LearningProgress;
import com.nihongo.learning.domain.model.Lesson;
import com.nihongo.learning.domain.port.LessonRepository;
import com.nihongo.learning.domain.port.ProgressRepository;
import java.util.List;

public final class DefaultLearningService implements LearningService {
    private final LessonRepository lessons;
    private final ProgressRepository progress;

    public DefaultLearningService(LessonRepository lessons, ProgressRepository progress) {
        this.lessons = lessons; this.progress = progress;
    }

    @Override public LearningPath getPath(String learnerId) {
        return path(learnerId, progress.findByLearnerId(learnerId));
    }

    @Override public LearningPath completeLesson(String learnerId, String lessonId) {
        Lesson target = lessons.findById(lessonId).orElseThrow(() -> new LessonNotFoundException(lessonId));
        LearningPath current = getPath(learnerId);
        if (!current.getProgress().getCompletedLessonIds().contains(lessonId)
                && !lessonId.equals(current.getNextLessonId())) {
            throw new LessonLockedException(target.getId());
        }
        return path(learnerId, progress.save(current.getProgress().complete(lessonId)));
    }

    private LearningPath path(String learnerId, LearningProgress state) {
        List<Lesson> ordered = lessons.findAllOrdered();
        String next = ordered.stream().map(Lesson::getId)
                .filter(id -> !state.getCompletedLessonIds().contains(id)).findFirst().orElse(null);
        return new LearningPath(ordered, state, next);
    }
}
