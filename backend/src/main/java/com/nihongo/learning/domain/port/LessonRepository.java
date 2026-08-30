package com.nihongo.learning.domain.port;

import com.nihongo.learning.domain.model.Lesson;
import java.util.List;
import java.util.Optional;

public interface LessonRepository {
    List<Lesson> findAllOrdered();
    Optional<Lesson> findById(String id);
}
