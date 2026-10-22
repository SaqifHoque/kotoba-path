package com.nihongo.learning.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
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

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:synonymtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "nihongo.catalog.import-on-startup=false"})
@AutoConfigureMockMvc
class MeaningSynonymsControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    private Cookie guest() throws Exception { return mvc.perform(get("/api/study-profile")).andReturn().getResponse().getCookie("kotoba_profile"); }
    private ObjectNode state(Cookie cookie) throws Exception { return (ObjectNode) json.readTree(mvc.perform(get("/api/study-profile").cookie(cookie)).andReturn().getResponse().getContentAsByteArray()); }
    private ObjectNode withSynonyms(ObjectNode state, String entries) throws Exception { ((ObjectNode) state.get("forge")).set("meaningSynonyms", json.readTree(entries)); return state; }
    private int save(Cookie cookie, ObjectNode state) throws Exception {
        return mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content(state.toString())).andReturn().getResponse().getStatus();
    }
    @Test void preferencesRoundTripWithoutChangingMasteryAndOldClientsCannotEraseThem() throws Exception {
        Cookie cookie = guest(); ObjectNode original = state(cookie);
        JsonNode record = json.readTree("{\"lessonAt\":10,\"note\":\"one line\",\"noteAt\":10,\"meaning\":{\"stage\":3,\"due\":12345,\"reviews\":2,\"correct\":2,\"misses\":0,\"updatedAt\":100}}");
        ((ObjectNode) original.path("forge").path("records")).set("r:一", record);
        assertEquals(200, save(cookie, withSynonyms(original, "{\"r:一\":{\"values\":[\"single line\"],\"updatedAt\":100}}")));
        ObjectNode restored = state(cookie); assertEquals(record, restored.path("forge").path("records").path("r:一"));
        assertEquals("single line", restored.path("forge").path("meaningSynonyms").path("r:一").path("values").get(0).asText());
        ((ObjectNode) restored.get("forge")).remove("meaningSynonyms"); assertEquals(200, save(cookie, restored));
        assertEquals("single line", state(cookie).path("forge").path("meaningSynonyms").path("r:一").path("values").get(0).asText());
        mvc.perform(get("/api/study-profile/reviews").cookie(cookie)).andExpect(jsonPath("$.total").value(0));
    }
    @Test void removalsAndIndependentEntriesSurviveStalePreferenceSnapshots() throws Exception {
        Cookie cookie = guest();
        assertEquals(200, save(cookie, withSynonyms(state(cookie), "{\"k:大\":{\"values\":[\"huge\"],\"updatedAt\":100}}")));
        assertEquals(200, save(cookie, withSynonyms(state(cookie), "{\"k:大\":{\"values\":[],\"updatedAt\":200}}")));
        assertEquals(200, save(cookie, withSynonyms(state(cookie), "{\"k:大\":{\"values\":[\"huge\"],\"updatedAt\":100},\"k:小\":{\"values\":[\"tiny\"],\"updatedAt\":150}}")));
        JsonNode aliases = state(cookie).path("forge").path("meaningSynonyms");
        assertTrue(aliases.path("k:大").path("values").isEmpty()); assertEquals("tiny", aliases.path("k:小").path("values").get(0).asText());
        assertEquals(200, save(cookie, withSynonyms(state(cookie), "{\"k:大\":{\"values\":[\"huge\"],\"updatedAt\":200}}")));
        assertTrue(state(cookie).path("forge").path("meaningSynonyms").path("k:大").path("values").isEmpty(), "equal-time removal wins");
        assertEquals(200, save(cookie, withSynonyms(state(cookie), "{}")));
        assertEquals(2, state(cookie).path("forge").path("meaningSynonyms").size());
    }
    @Test void equalTimestampTiesAreDeterministic() throws Exception {
        Cookie a = guest(), b = guest();
        String first = "{\"k:大\":{\"values\":[\"large\"],\"updatedAt\":100}}", second = "{\"k:大\":{\"values\":[\"huge\"],\"updatedAt\":100}}";
        assertEquals(200, save(a, withSynonyms(state(a), first))); assertEquals(200, save(a, withSynonyms(state(a), second)));
        assertEquals(200, save(b, withSynonyms(state(b), second))); assertEquals(200, save(b, withSynonyms(state(b), first)));
        assertEquals(state(a).path("forge").path("meaningSynonyms"), state(b).path("forge").path("meaningSynonyms"));
    }
    @Test void invalidPreferencesAreRejectedWithoutUpdatingTheProfile() throws Exception {
        Cookie cookie = guest();
        String[] invalid = {"{\"k:大\":{\"values\":[\"[n.]\"],\"updatedAt\":1}}", "{\"k:大\":{\"values\":[\"large\",\"the large\"],\"updatedAt\":1}}", "null", "[]", "{\"__proto__\":{\"values\":[\"word\"],\"updatedAt\":1}}", "{\"k:大\":{\"values\":[\"おお\"],\"updatedAt\":1}}", "{\"k:大\":{\"values\":[\"\"],\"updatedAt\":1}}", "{\"k:大\":{\"values\":[\"large\"],\"updatedAt\":-1}}", "{\"k:大\":{\"values\":[\"one\\ntwo\"],\"updatedAt\":1}}", "{\"k:大\":{\"values\":[\"one\",\"one\"],\"updatedAt\":1}}"};
        for (String entries : invalid) assertEquals(400, save(cookie, withSynonyms(state(cookie), entries)), entries);
        ObjectNode tooLong = json.createObjectNode(); tooLong.set("k:大", json.createObjectNode().put("updatedAt", 1).set("values", json.createArrayNode().add(new String(new char[81]).replace('\0', 'a'))));
        ObjectNode s = state(cookie); ((ObjectNode) s.get("forge")).set("meaningSynonyms", tooLong); assertEquals(400, save(cookie, s));
        assertEquals(0, state(cookie).path("revision").asInt());
    }
    @Test void preferenceCountsAreBounded() throws Exception {
        Cookie cookie = guest(); ObjectNode entries = json.createObjectNode();
        for (int i = 0; i < 6001; i++) entries.set("r:item" + i, json.createObjectNode().put("updatedAt", 1).set("values", json.createArrayNode().add("word")));
        ObjectNode s = state(cookie); ((ObjectNode) s.get("forge")).set("meaningSynonyms", entries); assertEquals(400, save(cookie, s));
        ObjectNode item = json.createObjectNode().put("updatedAt", 1); com.fasterxml.jackson.databind.node.ArrayNode values = json.createArrayNode(); for (int i = 0; i < 9; i++) values.add("word" + i); item.set("values", values);
        entries.removeAll(); entries.set("k:大", item); ((ObjectNode) s.get("forge")).set("meaningSynonyms", entries); assertEquals(400, save(cookie, s));
    }
    @Test void accountMigrationAndProfileIsolationIncludeSynonyms() throws Exception {
        Cookie cookie = guest(), other = guest();
        assertEquals(200, save(cookie, withSynonyms(state(cookie), "{\"k:大\":{\"values\":[\"huge\"],\"updatedAt\":100}}")));
        assertFalse(state(other).path("forge").path("meaningSynonyms").has("k:大"));
        ObjectNode credentials = json.createObjectNode().put("username", "syn_" + UUID.randomUUID().toString().substring(0, 8)).put("password", "a long synonym test password");
        MvcResult registered = mvc.perform(post("/api/study-profile/register").cookie(cookie).header("X-Kotoba-Request", "1").contentType("application/json").content(credentials.toString())).andExpect(status().isOk()).andReturn();
        Cookie session = mvc.perform(post("/api/account/login").header("X-Kotoba-Request", "1").contentType("application/json").content(credentials.toString())).andExpect(status().isOk()).andReturn().getResponse().getCookie("kotoba_session");
        String id = json.readTree(registered.getResponse().getContentAsByteArray()).path("id").asText();
        mvc.perform(get("/api/study-profile").cookie(session).header("X-Kotoba-Owner", id)).andExpect(jsonPath("$.forge.meaningSynonyms['k:大'].values[0]").value("huge"));
        mvc.perform(get("/api/study-profile").cookie(cookie)).andExpect(jsonPath("$.forge.meaningSynonyms['k:大']").doesNotExist());
    }
}
