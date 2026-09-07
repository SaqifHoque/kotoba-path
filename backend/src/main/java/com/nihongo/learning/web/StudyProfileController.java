package com.nihongo.learning.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.*;

/** The random browser-profile capability lives in an HttpOnly cookie, never a URL. */
@RestController
@RequestMapping("/api/study-profile")
public class StudyProfileController {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public StudyProfileController(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    @GetMapping
    public JsonNode get(@CookieValue(value="kotoba_profile", required=false) String id,
                        HttpServletRequest request, HttpServletResponse response) throws Exception {
        response.setHeader("Cache-Control", "no-store");
        List<Map<String,Object>> rows = validId(id)
            ? jdbc.queryForList("select revision,state_json from study_profile where id=?", id)
            : Collections.emptyList();
        if (rows.isEmpty()) {
            id = UUID.randomUUID().toString();
            jdbc.update("insert into study_profile(id,revision,state_json) values(?,0,?)", id, "{\"kanji\":{}}");
            response.addHeader("Set-Cookie", ResponseCookie.from("kotoba_profile", id)
                .httpOnly(true).secure(request.isSecure()).sameSite("Strict")
                .path("/api/study-profile").maxAge(31536000).build().toString());
            rows = jdbc.queryForList("select revision,state_json from study_profile where id=?", id);
        }
        ObjectNode state = (ObjectNode) json.readTree((String) rows.get(0).get("state_json"));
        state.put("revision", ((Number) rows.get(0).get("revision")).longValue());
        return state;
    }

    @PutMapping(consumes="application/json")
    public Map<String,Long> save(@CookieValue(value="kotoba_profile", required=false) String id,
                                @RequestBody JsonNode body, HttpServletRequest request) {
        if (!validId(id)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if ("cross-site".equals(request.getHeader("Sec-Fetch-Site"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        validate(body);
        long revision = body.path("revision").longValue();
        ObjectNode state = json.createObjectNode();
        state.set("kanji", body.get("kanji"));
        int changed = jdbc.update("update study_profile set state_json=?,revision=revision+1 where id=? and revision=?",
            state.toString(), id, revision);
        if (changed != 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Reload and merge before saving.");
        return Collections.singletonMap("revision", revision + 1);
    }

    private boolean validId(String id) {
        return id != null && id.matches("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}");
    }

    private void require(boolean condition) {
        if (!condition) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid study progress");
    }

    private void validate(JsonNode body) {
        require(body.isObject() && body.toString().length() <= 2000000);
        JsonNode revision = body.path("revision");
        require(revision.isIntegralNumber() && revision.canConvertToLong()
            && revision.asLong() >= 0 && revision.asLong() < 9007199254740991L);
        JsonNode reviews = body.path("kanji");
        require(reviews.isObject() && reviews.size() <= 2000);
        reviews.fields().forEachRemaining(entry -> {
            require(entry.getKey().codePointCount(0, entry.getKey().length()) == 1);
            JsonNode p = entry.getValue();
            require(p.isObject() && p.path("learned").isBoolean());
            require(p.path("stage").isInt() && p.path("stage").asInt() >= 0 && p.path("stage").asInt() <= 6);
            require(p.path("attempts").isInt() && p.path("attempts").asInt() >= 1);
            JsonNode due = p.path("due");
            require(due.isIntegralNumber() && due.canConvertToLong() && due.asLong() >= 0 && due.asLong() <= 8640000000000000L);
        });
    }
}
