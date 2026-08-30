package com.nihongo.learning.domain.port;

import com.nihongo.learning.domain.model.LearningProgress;

public interface ProgressRepository {
    LearningProgress findByLearnerId(String learnerId);
    LearningProgress save(LearningProgress progress);
}
