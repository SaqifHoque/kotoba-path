package com.nihongo.learning.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.nihongo.learning.account.AccountSecrets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import javax.servlet.http.Cookie;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:accounttest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "nihongo.catalog.import-on-startup=false"})
@AutoConfigureMockMvc
class AccountControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    private static final String PASSWORD = "a long test passphrase 123";

    @BeforeEach void clearThrottle() { jdbc.update("delete from account_rate_limit"); }

    private Cookie guest() throws Exception {
        return mvc.perform(get("/api/study-profile")).andExpect(status().isOk()).andReturn().getResponse().getCookie("kotoba_profile");
    }
    private MockHttpServletRequestBuilder auth(String endpoint, String username, String password) throws Exception {
        return post(endpoint).header("X-Kotoba-Request", "1").contentType("application/json")
            .content(json.createObjectNode().put("username", username).put("password", password).toString());
    }
    private MvcResult register(String username, Cookie guest) throws Exception {
        return mvc.perform(auth("/api/study-profile/register", username, PASSWORD).cookie(guest))
            .andExpect(status().isOk()).andReturn();
    }

    @Test void registrationClaimsAllProgressAndAnotherDeviceRestoresIt() throws Exception {
        Cookie guest = guest();
        ObjectNode state = (ObjectNode) json.readTree(mvc.perform(get("/api/study-profile").cookie(guest)).andReturn().getResponse().getContentAsString());
        state.set("kanji", json.readTree("{\"日\":{\"learned\":true,\"stage\":1,\"due\":100,\"attempts\":2}}"));
        state.set("profile", json.readTree("{\"level\":\"N3\",\"familiarity\":\"studying\",\"updatedAt\":1}"));
        state.set("vocabulary", json.readTree("{\"word\":{\"learned\":true,\"stage\":2,\"due\":200,\"attempts\":3}}"));
        ObjectNode forge = (ObjectNode) state.get("forge"); forge.put("dailyLimit", 20);
        mvc.perform(put("/api/study-profile").cookie(guest).contentType("application/json").content(state.toString())).andExpect(status().isOk());
        MvcResult registered = register("Learner_One", guest);
        JsonNode account = json.readTree(registered.getResponse().getContentAsString());
        Cookie session = registered.getResponse().getCookie("kotoba_session");
        assertTrue(session.isHttpOnly()); assertEquals("/api", session.getPath()); assertTrue(registered.getResponse().getHeaders("Set-Cookie").stream().anyMatch(value -> value.contains("kotoba_session=") && value.contains("SameSite=Strict")));
        assertEquals(43, account.path("recoveryKey").asText().length());
        String owner = account.path("id").asText();
        mvc.perform(get("/api/study-profile").cookie(session).header("X-Kotoba-Owner", owner))
            .andExpect(jsonPath("$.kanji.日.attempts").value(2)).andExpect(jsonPath("$.profile.level").value("N3"))
            .andExpect(jsonPath("$.vocabulary.word.attempts").value(3)).andExpect(jsonPath("$.forge.dailyLimit").value(20));
        ObjectNode accountState = state.deepCopy(); accountState.put("revision", 1);
        ((ObjectNode) accountState.get("profile")).put("level", "N2");
        mvc.perform(put("/api/study-profile").cookie(session).header("X-Kotoba-Owner", owner).contentType("application/json").content(accountState.toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(2));
        mvc.perform(put("/api/study-profile").cookie(session).header("X-Kotoba-Owner", owner).contentType("application/json").content(accountState.toString()))
            .andExpect(status().isConflict());
        // Knowing the pre-registration guest cookie no longer grants account access.
        mvc.perform(get("/api/study-profile").cookie(guest)).andExpect(jsonPath("$.kanji").isEmpty());
        state.put("revision", 1);
        mvc.perform(put("/api/study-profile").cookie(guest).contentType("application/json").content(state.toString())).andExpect(status().isUnauthorized());
        MvcResult second = mvc.perform(auth("/api/account/login", "LEARNER_ONE", PASSWORD)).andExpect(status().isOk()).andReturn();
        mvc.perform(get("/api/study-profile").cookie(second.getResponse().getCookie("kotoba_session")).header("X-Kotoba-Owner", owner))
            .andExpect(jsonPath("$.kanji.日.attempts").value(2)).andExpect(jsonPath("$.profile.level").value("N2"));
        assertNotEquals(session.getValue(), second.getResponse().getCookie("kotoba_session").getValue());
        String stored = jdbc.queryForObject("select password_hash from learner_account where id=?", String.class, owner);
        assertNotEquals(PASSWORD, stored); assertTrue(AccountSecrets.matches(PASSWORD, stored));
        assertFalse(jdbc.queryForList("select token_hash from account_session").toString().contains(session.getValue()));
        assertFalse(jdbc.queryForObject("select recovery_hash from learner_account where id=?", String.class, owner).equals(account.path("recoveryKey").asText()));
    }

    @Test void recoveryRotatesKeyAndPasswordAndRevokesEveryOldSession() throws Exception {
        MvcResult registered = register("recovery_user", guest());
        JsonNode account = json.readTree(registered.getResponse().getContentAsString());
        Cookie old = registered.getResponse().getCookie("kotoba_session");
        Cookie second = mvc.perform(auth("/api/account/login", "recovery_user", PASSWORD)).andReturn().getResponse().getCookie("kotoba_session");
        ObjectNode request = json.createObjectNode().put("username", "recovery_user").put("password", "replacement password 456").put("recoveryKey", account.path("recoveryKey").asText());
        MvcResult recovered = mvc.perform(post("/api/account/recover").header("X-Kotoba-Request", "1").contentType("application/json").content(request.toString())).andExpect(status().isOk()).andReturn();
        assertNotEquals(account.path("recoveryKey").asText(), json.readTree(recovered.getResponse().getContentAsString()).path("recoveryKey").asText());
        mvc.perform(get("/api/study-profile").cookie(old)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/study-profile").cookie(second)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/account/recover").header("X-Kotoba-Request", "1").contentType("application/json").content(request.toString())).andExpect(status().isUnauthorized());
        mvc.perform(auth("/api/account/login", "recovery_user", PASSWORD)).andExpect(status().isUnauthorized());
        mvc.perform(auth("/api/account/login", "recovery_user", "replacement password 456")).andExpect(status().isOk());
    }

    @Test void rejectsStaleTabsCrossSiteRequestsAndExpiredSessions() throws Exception {
        MvcResult registered = register("tab_user", guest());
        Cookie session = registered.getResponse().getCookie("kotoba_session");
        String owner = json.readTree(registered.getResponse().getContentAsString()).path("id").asText();
        mvc.perform(get("/api/study-profile").cookie(session).header("X-Kotoba-Owner", "guest")).andExpect(status().isConflict());
        mvc.perform(put("/api/study-profile").cookie(session).contentType("application/json").content("{}")).andExpect(status().isConflict());
        mvc.perform(post("/api/account/logout").cookie(session)).andExpect(status().isForbidden());
        mvc.perform(auth("/api/account/login", "tab_user", PASSWORD).header("Sec-Fetch-Site", "cross-site")).andExpect(status().isForbidden());
        mvc.perform(get("/api/account").cookie(session)).andExpect(header().string("Cache-Control", "no-store")).andExpect(jsonPath("$.username").value("tab_user"));
        jdbc.update("update account_session set expires_at=0 where account_id=?", owner);
        mvc.perform(get("/api/study-profile").cookie(session)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/account").cookie(session)).andExpect(jsonPath("$.id").value("guest"));
    }

    @Test void validatesNamesPasswordsDuplicatesAndThrottlesFailures() throws Exception {
        Cookie guest = guest();
        mvc.perform(auth("/api/study-profile/register", "bad name", PASSWORD).cookie(guest)).andExpect(status().isBadRequest());
        mvc.perform(auth("/api/study-profile/register", "valid_name", "short").cookie(guest)).andExpect(status().isBadRequest());
        register("unique_user", guest);
        mvc.perform(auth("/api/study-profile/register", "UNIQUE_USER", PASSWORD).cookie(guest())).andExpect(status().isConflict());
        jdbc.update("delete from account_rate_limit");
        for (int i = 0; i < 20; i++) mvc.perform(auth("/api/account/login", "unique_user", "wrong password" )).andExpect(status().isUnauthorized());
        mvc.perform(auth("/api/account/login", "unique_user", PASSWORD)).andExpect(status().isTooManyRequests()).andExpect(header().string("Retry-After", "600"));
        jdbc.update("update account_rate_limit set window_start=0");
        mvc.perform(auth("/api/account/login", "unique_user", PASSWORD)).andExpect(status().isOk());
    }

    @Test void logoutRevokesOnlyCurrentDeviceAndCreatesNoAccountDataForGuests() throws Exception {
        mvc.perform(get("/api/account")).andExpect(jsonPath("$.id").value("guest"));
        MvcResult registered = register("logout_user", guest());
        Cookie first = registered.getResponse().getCookie("kotoba_session");
        Cookie second = mvc.perform(auth("/api/account/login", "logout_user", PASSWORD)).andReturn().getResponse().getCookie("kotoba_session");
        mvc.perform(post("/api/account/logout").cookie(first).header("X-Kotoba-Request", "1")).andExpect(status().isOk()).andExpect(cookie().maxAge("kotoba_session", 0));
        mvc.perform(get("/api/study-profile").cookie(first)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/account").cookie(second)).andExpect(jsonPath("$.username").value("logout_user"));
        mvc.perform(get("/api/study-profile")).andExpect(jsonPath("$.kanji").isEmpty());
    }

    @Test void httpsSessionsUseSecureCookies() throws Exception {
        Cookie guest = guest();
        mvc.perform(auth("/api/study-profile/register", "secure_user", PASSWORD).cookie(guest).secure(true))
            .andExpect(status().isOk()).andExpect(cookie().secure("kotoba_session", true))
            .andExpect(header().string("Cache-Control", "no-store"));
    }
}
