package com.nihongo.learning.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Immutable attempt receipts. Snapshot saves and appended events share one transaction. */
@Service
public class ReviewHistory {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    public ReviewHistory(JdbcTemplate jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    public List<String> append(String profile, JsonNode events) throws Exception {
        if (events == null) return Collections.emptyList();
        require(events.isArray() && events.size() <= 100);
        for (JsonNode event : events) validate(event);
        List<String> acknowledged = new ArrayList<>();
        for (JsonNode event : events) {
            String id = event.path("id").asText();
            List<String> previous = jdbc.query("select event_json from review_event where profile_id=? and event_id=?", (rs, row) -> rs.getString(1), profile, id);
            if (!previous.isEmpty()) {
                if (!json.readTree(previous.get(0)).equals(event)) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "An attempt ID cannot be reused for different answers.");
            } else {
                jdbc.update("insert into review_event(profile_id,event_id,kind,outcome,received_at,event_json) values(?,?,?,?,?,?)",
                    profile, id, event.path("kind").asText(), event.path("outcome").asText(), System.currentTimeMillis(), event.toString());
            }
            acknowledged.add(id);
        }
        return acknowledged;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public Map<String, Object> page(String profile, Long before, int limit) throws Exception {
        require(limit >= 1 && limit <= 100 && (before == null || before > 0));
        long cursor = before == null ? Long.MAX_VALUE : before;
        List<Map<String, Object>> rows = jdbc.queryForList("select sequence_id,received_at,event_json from review_event where profile_id=? and sequence_id<? order by sequence_id desc limit ?", profile, cursor, limit + 1);
        boolean more = rows.size() > limit;
        if (more) rows = rows.subList(0, limit);
        List<ObjectNode> events = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            ObjectNode event = (ObjectNode) json.readTree((String) row.get("event_json"));
            // Decimal cursors stay exact even beyond JavaScript's safe integer range.
            event.put("sequence", row.get("sequence_id").toString());
            event.put("receivedAt", ((Number) row.get("received_at")).longValue());
            events.add(event);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("events", events);
        result.put("nextCursor", more ? rows.get(rows.size() - 1).get("sequence_id").toString() : json.getNodeFactory().nullNode());
        result.put("total", jdbc.queryForObject("select count(*) from review_event where profile_id=?", Long.class, profile));
        result.put("scheduled", jdbc.queryForObject("select count(*) from review_event where profile_id=? and kind='scheduled'", Long.class, profile));
        result.put("remembered", jdbc.queryForObject("select count(*) from review_event where profile_id=? and kind='scheduled' and outcome in ('good','hard','correct')", Long.class, profile));
        return result;
    }

    private void validate(JsonNode event) {
        require(event.isObject() && event.size() == 8);
        require(event.path("id").isTextual() && event.path("id").asText().matches("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}"));
        String mode = event.path("mode").asText(), skill = event.path("skill").asText(), outcome = event.path("outcome").asText();
        require(Arrays.asList("kanji", "vocabulary", "forge").contains(mode));
        require(Arrays.asList("meaning", "reading", "both").contains(skill));
        require(Arrays.asList("learning", "scheduled").contains(event.path("kind").asText()));
        require((mode.equals("forge") ? Arrays.asList("correct", "incorrect") : Arrays.asList("again", "hard", "good")).contains(outcome));
        for (String key : Arrays.asList("subject", "label")) require(event.path(key).isTextual() && !event.path(key).asText().trim().isEmpty() && event.path(key).asText().length() <= 200);
        require(!mode.equals("kanji") || event.path("subject").asText().codePointCount(0, event.path("subject").asText().length()) == 1);
        require(!mode.equals("forge") || event.path("subject").asText().matches("[rkv]:.{1,198}"));
        JsonNode at = event.path("occurredAt");
        require(at.isIntegralNumber() && at.canConvertToLong() && at.asLong() >= 0 && at.asLong() <= 8640000000000000L);
    }
    private void require(boolean valid) { if (!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid review history request"); }
}
