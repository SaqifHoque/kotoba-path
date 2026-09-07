package com.nihongo.learning.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import javax.servlet.http.Cookie;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:profiletest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1","nihongo.catalog.import-on-startup=false"})
@AutoConfigureMockMvc
class StudyProfileControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test void persistsIsolatesAndRejectsStaleSnapshots() throws Exception {
        MvcResult initial=mvc.perform(get("/api/study-profile")).andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andReturn();
        Cookie cookie=initial.getResponse().getCookie("kotoba_profile");
        assertNotNull(cookie); assertTrue(cookie.isHttpOnly());
        assertTrue(initial.getResponse().getHeader("Set-Cookie").contains("SameSite=Strict"));
        ObjectNode state=(ObjectNode)json.readTree(initial.getResponse().getContentAsString());
        assertTrue(state.get("profile").isNull());
        state.set("profile",json.readTree("{\"level\":\"N3\",\"familiarity\":\"studying\",\"updatedAt\":1,\"placement\":{\"correct\":4,\"total\":5,\"suggested\":\"N2\"}}"));
        state.set("kanji",json.readTree("{\"日\":{\"learned\":true,\"stage\":1,\"due\":100,\"attempts\":2}}"));
        mvc.perform(put("/api/study-profile").cookie(cookie).header("Origin","http://localhost:4200").contentType("application/json").content(state.toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.revision").value(1));
        mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content(state.toString())).andExpect(status().isConflict());
        mvc.perform(get("/api/study-profile").cookie(cookie)).andExpect(jsonPath("$.kanji.日.attempts").value(2))
            .andExpect(jsonPath("$.profile.level").value("N3")).andExpect(jsonPath("$.profile.placement.suggested").value("N2"));
        mvc.perform(get("/api/study-profile")).andExpect(jsonPath("$.kanji").isEmpty()).andExpect(jsonPath("$.profile").isEmpty());
        state.put("revision",1);
        state.remove("profile");
        mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content(state.toString())).andExpect(status().isOk());
        mvc.perform(get("/api/study-profile").cookie(cookie)).andExpect(jsonPath("$.kanji.日.attempts").value(2))
            .andExpect(jsonPath("$.profile.level").value("N3"));
        Cookie secure=mvc.perform(get("/api/study-profile").secure(true)).andReturn().getResponse().getCookie("kotoba_profile");
        assertTrue(secure.getSecure());
    }

    @Test void rejectsMalformedUnauthenticatedAndCrossSiteWrites() throws Exception {
        Cookie cookie=mvc.perform(get("/api/study-profile")).andReturn().getResponse().getCookie("kotoba_profile");
        mvc.perform(put("/api/study-profile").contentType("application/json").content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content("{}")).andExpect(status().isBadRequest());
        mvc.perform(put("/api/study-profile").cookie(cookie).header("Sec-Fetch-Site","cross-site").contentType("application/json").content("{}")).andExpect(status().isForbidden());
        String bad="{\"revision\":0,\"kanji\":{\"日\":{\"learned\":true,\"stage\":99,\"due\":1,\"attempts\":1}}}";
        mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content(bad)).andExpect(status().isBadRequest());
        String overflow=bad.replace("99","1").replace("\"due\":1","\"due\":18446744073709551616");
        mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content(overflow)).andExpect(status().isBadRequest());
        String badProfile="{\"revision\":0,\"profile\":{\"level\":\"N0\",\"familiarity\":\"studying\",\"updatedAt\":1},\"kanji\":{}}";
        mvc.perform(put("/api/study-profile").cookie(cookie).contentType("application/json").content(badProfile)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/study-profile").cookie(cookie)).andExpect(jsonPath("$.kanji").isEmpty());
    }
}
