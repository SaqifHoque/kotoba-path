package com.nihongo.learning.infrastructure.repository;

import com.nihongo.learning.domain.model.LearningProgress;
import com.nihongo.learning.domain.port.ProgressRepository;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class InMemoryProgressRepository implements ProgressRepository {
    private final Map<String, LearningProgress> store = new ConcurrentHashMap<>();
    @Override public LearningProgress findByLearnerId(String learnerId) {
        return store.getOrDefault(learnerId, new LearningProgress(learnerId, Collections.emptySet()));
    }
    @Override public LearningProgress save(LearningProgress progress) { store.put(progress.getLearnerId(), progress); return progress; }
}
