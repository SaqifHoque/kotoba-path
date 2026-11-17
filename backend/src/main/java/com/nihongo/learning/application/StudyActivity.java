package com.nihongo.learning.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.PreparedStatement;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Read-only quest evidence from immutable receipts, including late/offline uploads. */
@Service
public class StudyActivity {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    public StudyActivity(JdbcTemplate jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    @Transactional(readOnly = true)
    public Map<String, Object> summarize(String profile, long from, long to, List<String> pendingIds) {
        if (from < 0 || to > 8640000000000000L || to <= from || to - from > 26 * 3600000L ||
                pendingIds.size() > 10 || pendingIds.stream().anyMatch(id -> !id.matches("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid activity window or receipt IDs");
        }
        Set<String> requested = new HashSet<>(pendingIds);
        Set<String> included = new LinkedHashSet<>();
        int[] recalls = {0};
        boolean[] skills = {false, false};
        jdbc.query(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                "select event_id,event_json from review_event where profile_id=? and kind='scheduled' order by sequence_id desc");
            statement.setString(1, profile);
            statement.setFetchSize(100);
            return statement;
        }, (RowCallbackHandler) row -> {
            String id = row.getString("event_id");
            // Once goals are full, only requested IDs still need inspection.
            if (recalls[0] == 5 && skills[0] && skills[1] && !requested.contains(id)) return;
            JsonNode event;
            try { event = json.readTree(row.getString("event_json")); }
            catch (java.io.IOException error) { throw new IllegalStateException("Invalid stored review receipt", error); }
            long at = event.path("occurredAt").asLong();
            if (at < from || at >= to) return;
            recalls[0] = Math.min(5, recalls[0] + 1);
            String skill = event.path("skill").asText();
            skills[0] |= skill.equals("meaning") || skill.equals("both");
            skills[1] |= skill.equals("reading") || skill.equals("both");
            if (requested.contains(id)) included.add(id);
        });
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", from); result.put("to", to);
        result.put("recalls", recalls[0]); result.put("meaning", skills[0]); result.put("reading", skills[1]);
        result.put("includedPendingIds", included);
        return result;
    }
}
