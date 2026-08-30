package com.nihongo.learning.infrastructure.config;

import com.nihongo.learning.application.*;
import com.nihongo.learning.domain.port.*;
import com.nihongo.learning.infrastructure.repository.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LearningConfiguration {
    @Bean LessonRepository lessonRepository() { return new InMemoryLessonRepository(); }
    @Bean ProgressRepository progressRepository() { return new InMemoryProgressRepository(); }
    @Bean LearningService learningService(LessonRepository lessons, ProgressRepository progress) {
        return new DefaultLearningService(lessons, progress);
    }
}
