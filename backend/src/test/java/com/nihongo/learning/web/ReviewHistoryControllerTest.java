package com.nihongo.learning.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import java.util.concurrent.*;
import javax.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:historytest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "nihongo.catalog.import-on-startup=false"})
@AutoConfigureMockMvc
class ReviewHistoryControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    private Cookie guest() throws Exception { return mvc.perform(get("/api/study-profile")).andReturn().getResponse().getCookie("kotoba_profile"); }
    private ObjectNode state(Cookie cookie) throws Exception {
        return (ObjectNode) json.readTree(mvc.perform(get("/api/study-profile").cookie(cookie)).andReturn().getResponse().getContentAsString());
    }
    private ObjectNode event() {
        return json.createObjectNode().put("id", UUID.randomUUID().toString()).put("mode", "kanji").put("subject", "日").put("label", "日")
            .put("skill", "both").put("kind", "scheduled").put("outcome", "good").put("occurredAt", 1000);
    }
    private ObjectNode withEvents(ObjectNode state, JsonNode... events) {
        state.set("reviewEvents", json.valueToTree(Arrays.asList(events))); return state;
    }
    private MvcResult save(Cookie cookie, ObjectNode state) throws Exception {
        return mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content(state.toString())).andReturn();
    }
    private JsonNode history(Cookie cookie) throws Exception {
        return json.readTree(mvc.perform(get("/api/study-profile/reviews").cookie(cookie)).andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store")).andReturn().getResponse().getContentAsString());
    }

    @Test void eventsAreAtomicWithSnapshotAndRetriesAreIdempotent() throws Exception {
        Cookie cookie = guest(); ObjectNode attempt = event(); ObjectNode state = withEvents(state(cookie), attempt);
        assertEquals(200, save(cookie, state).getResponse().getStatus());
        assertEquals(1, history(cookie).path("total").asInt());
        assertEquals(409, save(cookie, state).getResponse().getStatus()); // lost response, same revision
        ObjectNode retry = withEvents(state(cookie), attempt);
        MvcResult response = save(cookie, retry); assertEquals(200, response.getResponse().getStatus());
        assertEquals(attempt.path("id"), json.readTree(response.getResponse().getContentAsString()).path("acknowledgedEvents").get(0));
        assertEquals(1, history(cookie).path("total").asInt());
        assertEquals(200, save(cookie, state(cookie)).getResponse().getStatus()); // older client omits history
        assertEquals(1, history(cookie).path("total").asInt());
        assertFalse(state(cookie).has("reviewEvents"));
    }

    @Test void conflictingOrMalformedEventsRollBackEveryWrite() throws Exception {
        Cookie cookie = guest(); ObjectNode original = event();
        assertEquals(200, save(cookie, withEvents(state(cookie), original)).getResponse().getStatus());
        ObjectNode altered = original.deepCopy().put("outcome", "again");
        ObjectNode changed = withEvents(state(cookie), event(), altered);
        changed.set("kanji", json.readTree("{\"日\":{\"learned\":true,\"stage\":1,\"due\":100,\"attempts\":1}}"));
        assertEquals(422, save(cookie, changed).getResponse().getStatus());
        assertEquals(1, history(cookie).path("total").asInt());
        assertEquals(1, state(cookie).path("revision").asInt()); assertTrue(state(cookie).path("kanji").isEmpty());
        assertEquals(400, save(cookie, withEvents(state(cookie), event().put("mode", "unknown"))).getResponse().getStatus());
        assertEquals(400, save(cookie, withEvents(state(cookie), event().put("occurredAt", -1))).getResponse().getStatus());
        assertEquals(400, save(cookie, withEvents(state(cookie), event().put("id", "not-an-id"))).getResponse().getStatus());
        assertEquals(400, save(cookie, withEvents(state(cookie), event().put("outcome", "correct"))).getResponse().getStatus());
        assertEquals(1, state(cookie).path("revision").asInt());
    }

    @Test void pagesHaveStableReceiptCursorsAndSeparateScheduledRecallFromLessons() throws Exception {
        Cookie cookie = guest();
        ObjectNode first = event(), second = event().put("kind", "learning").put("outcome", "again"), third = event().put("outcome", "again");
        assertEquals(200, save(cookie, withEvents(state(cookie), first, second, third)).getResponse().getStatus());
        JsonNode page = json.readTree(mvc.perform(get("/api/study-profile/reviews?limit=2").cookie(cookie)).andReturn().getResponse().getContentAsString());
        assertEquals(3, page.path("total").asInt()); assertEquals(2, page.path("scheduled").asInt()); assertEquals(1, page.path("remembered").asInt());
        assertEquals(third.path("id"), page.path("events").get(0).path("id")); assertTrue(page.path("nextCursor").isTextual());
        assertEquals(200, save(cookie, withEvents(state(cookie), event())).getResponse().getStatus());
        JsonNode older = json.readTree(mvc.perform(get("/api/study-profile/reviews").param("limit", "2").param("before", page.path("nextCursor").asText()).cookie(cookie)).andReturn().getResponse().getContentAsString());
        assertEquals(1, older.path("events").size()); assertEquals(first.path("id"), older.path("events").get(0).path("id")); assertTrue(older.path("nextCursor").isNull());
    }

    @Test void profileIsolationAndAccountMigrationPreserveHistory() throws Exception {
        Cookie owner = guest(), other = guest(); ObjectNode attempt = event();
        assertEquals(200, save(owner, withEvents(state(owner), attempt)).getResponse().getStatus());
        assertEquals(0, history(other).path("total").asInt());
        assertEquals(200, save(other, withEvents(state(other), attempt)).getResponse().getStatus()); // same ID belongs to a different profile
        ObjectNode credentials = json.createObjectNode().put("username", "history_" + UUID.randomUUID().toString().substring(0, 8)).put("password", "a long history test password");
        MvcResult registered = mvc.perform(post("/api/study-profile/register").cookie(owner).header("X-Kotoba-Request", "1").contentType("application/json").content(credentials.toString())).andExpect(status().isOk()).andReturn();
        Cookie session = registered.getResponse().getCookie("kotoba_session");
        String account = json.readTree(registered.getResponse().getContentAsString()).path("id").asText();
        mvc.perform(get("/api/study-profile/reviews").cookie(owner)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/study-profile/reviews").cookie(session).header("X-Kotoba-Owner", account)).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/study-profile/reviews").cookie(session).header("X-Kotoba-Owner", "guest")).andExpect(status().isConflict());
    }

    @Test void simultaneousSavesKeepBothAttemptsAfterConflictRetry() throws Exception {
        Cookie cookie = guest(); ObjectNode base = state(cookie), one = event(), two = event();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch start = new CountDownLatch(1);
            Future<Integer> a = pool.submit(() -> { start.await(); return save(cookie, withEvents(base.deepCopy(), one)).getResponse().getStatus(); });
            Future<Integer> b = pool.submit(() -> { start.await(); return save(cookie, withEvents(base.deepCopy(), two)).getResponse().getStatus(); });
            start.countDown(); int sa = a.get(10, TimeUnit.SECONDS), sb = b.get(10, TimeUnit.SECONDS);
            assertEquals(new HashSet<>(Arrays.asList(200, 409)), new HashSet<>(Arrays.asList(sa, sb)));
            assertEquals(200, save(cookie, withEvents(state(cookie), sa == 409 ? one : two)).getResponse().getStatus());
            assertEquals(2, history(cookie).path("total").asInt());
        } finally { pool.shutdownNow(); }
    }

    @Test void rejectsUnboundedBatchesAndPages() throws Exception {
        Cookie cookie = guest(); ObjectNode request = state(cookie);
        com.fasterxml.jackson.databind.node.ArrayNode events = json.createArrayNode();
        for (int i = 0; i < 101; i++) events.add(event()); request.set("reviewEvents", events);
        assertEquals(400, save(cookie, request).getResponse().getStatus());
        mvc.perform(get("/api/study-profile/reviews?limit=101").cookie(cookie)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/study-profile/reviews?before=-1").cookie(cookie)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/study-profile/reviews")).andExpect(status().isUnauthorized());
    }
}
