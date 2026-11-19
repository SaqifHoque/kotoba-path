package com.nihongo.learning.application;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Indexed quest evidence from immutable receipts, including late/offline uploads. */
@Service
public class StudyActivity {
    private final JdbcTemplate jdbc;
    public StudyActivity(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Map<String, Object> summarize(String profile, long from, long to, List<String> pendingIds) {
        if (from < 0 || to > 8640000000000000L || to <= from || to - from > 26 * 3600000L ||
                pendingIds.size() > 10 || pendingIds.stream().anyMatch(id -> !id.matches("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid activity window or receipt IDs");
        }
        // Each result set is bounded. Skill probes can use their own index even when one skill is absent.
        int recalls = jdbc.queryForList(
            "select event_id from review_event where profile_id=? and kind='scheduled' and occurred_at>=? and occurred_at<? limit 5",
            String.class, profile, from, to).size();
        boolean meaning = hasSkill(profile, from, to, "meaning");
        boolean reading = hasSkill(profile, from, to, "reading");
        Set<String> included = new LinkedHashSet<>();
        for (String id : new LinkedHashSet<>(pendingIds)) {
            if (!jdbc.queryForList(
                    "select event_id from review_event where profile_id=? and event_id=? and kind='scheduled' and occurred_at>=? and occurred_at<?",
                    String.class, profile, id, from, to).isEmpty()) included.add(id);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", from); result.put("to", to);
        result.put("recalls", recalls); result.put("meaning", meaning); result.put("reading", reading);
        result.put("includedPendingIds", included);
        return result;
    }

    private boolean hasSkill(String profile, long from, long to, String skill) {
        return !jdbc.queryForList(
            "select event_id from review_event where profile_id=? and kind='scheduled' and skill in (?, 'both') and occurred_at>=? and occurred_at<? limit 1",
            String.class, profile, skill, from, to).isEmpty();
    }
}
