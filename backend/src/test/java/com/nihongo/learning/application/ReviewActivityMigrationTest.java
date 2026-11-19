package com.nihongo.learning.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import static org.junit.jupiter.api.Assertions.*;

class ReviewActivityMigrationTest {
    private final ObjectMapper json = new ObjectMapper();

    private String database() {
        return "jdbc:h2:mem:activity_upgrade_" + UUID.randomUUID() + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";
    }
    private ObjectNode receipt(String id, long at, String skill) {
        return json.createObjectNode().put("id",id).put("mode","forge").put("subject","k:人").put("label","人")
            .put("kind","scheduled").put("outcome","incorrect").put("skill",skill).put("occurredAt",at);
    }

    @Test void upgradesMultipleBatchesWithoutRewritingHistoryOrProfileState() throws Exception {
        String url = database();
        Flyway.configure().dataSource(url,"sa","").target("4").load().migrate();
        JdbcTemplate jdbc = new JdbcTemplate(new DriverManagerDataSource(url,"sa",""));
        String profile = UUID.randomUUID().toString(), other = UUID.randomUUID().toString();
        jdbc.update("insert into study_profile(id,revision,state_json) values(?,7,?)",profile,"{}");
        jdbc.update("insert into study_profile(id,revision,state_json) values(?,9,?)",other,"{}");
        String shared = UUID.randomUUID().toString();
        for (int i=0;i<1201;i++) {
            String id = i==0 ? shared : UUID.randomUUID().toString();
            String skill = Arrays.asList("meaning","reading","both").get(i%3);
            jdbc.update("insert into review_event(profile_id,event_id,kind,outcome,received_at,event_json) values(?,?,'scheduled','incorrect',?,?)",
                profile,id,10000+i,receipt(id,i==0?8640000000000000L:1000+i,skill).toString());
        }
        jdbc.update("insert into review_event(profile_id,event_id,kind,outcome,received_at,event_json) values(?,?,'scheduled','incorrect',?,?)",
            other,shared,99,receipt(shared,0,"both").toString());
        String columns = "sequence_id,profile_id,event_id,kind,outcome,received_at,event_json";
        List<Map<String,Object>> original = jdbc.queryForList("select "+columns+" from review_event order by sequence_id");
        List<Map<String,Object>> profiles = jdbc.queryForList("select * from study_profile order by id");
        Flyway upgraded = Flyway.configure().dataSource(url,"sa","").load();
        assertEquals(1,upgraded.migrate().migrationsExecuted);
        assertEquals(original,jdbc.queryForList("select "+columns+" from review_event order by sequence_id"));
        assertEquals(profiles,jdbc.queryForList("select * from study_profile order by id"));
        jdbc.query("select event_json,occurred_at,skill from review_event", row -> {
            try {
                ReviewActivityFields expected = ReviewActivityFields.from(json.readTree(row.getString("event_json")));
                assertEquals(expected.occurredAt,row.getLong("occurred_at"));
                assertEquals(expected.skill,row.getString("skill"));
            } catch (java.io.IOException error) { throw new AssertionError(error); }
        });
        upgraded.validate();
        assertEquals(0,upgraded.migrate().migrationsExecuted);
        assertThrows(Exception.class,()->jdbc.update("update review_event set skill='invalid' where event_id=?",shared));
        assertThrows(Exception.class,()->jdbc.update("update review_event set occurred_at=-1 where event_id=?",shared));
        assertThrows(Exception.class,()->jdbc.update("update review_event set occurred_at=null where event_id=?",shared));
    }

    @Test void invalidLegacyFieldsFailWithoutChangingOriginalReceipts() {
        String url = database();
        Flyway.configure().dataSource(url,"sa","").target("4").load().migrate();
        JdbcTemplate jdbc = new JdbcTemplate(new DriverManagerDataSource(url,"sa",""));
        String profile = UUID.randomUUID().toString(), id = UUID.randomUUID().toString();
        jdbc.update("insert into study_profile(id,revision,state_json) values(?,0,'{}')",profile);
        String original = receipt(id,1000,"invalid").toString();
        jdbc.update("insert into review_event(profile_id,event_id,kind,outcome,received_at,event_json) values(?,?,'scheduled','incorrect',1,?)",profile,id,original);
        assertThrows(Exception.class,()->Flyway.configure().dataSource(url,"sa","").load().migrate());
        assertEquals(original,jdbc.queryForObject("select event_json from review_event",String.class));
        assertEquals(1,jdbc.queryForObject("select count(*) from review_event",Integer.class));
    }

    @Test void projectionRejectsCoercionsAndPreservesFullTimestampRange() {
        String id = UUID.randomUUID().toString();
        assertEquals(0,ReviewActivityFields.from(receipt(id,0,"both")).occurredAt);
        assertEquals(8640000000000000L,ReviewActivityFields.from(receipt(id,8640000000000000L,"meaning")).occurredAt);
        assertThrows(IllegalArgumentException.class,()->ReviewActivityFields.from(receipt(id,-1,"both")));
        assertThrows(IllegalArgumentException.class,()->ReviewActivityFields.from(receipt(id,8640000000000001L,"both")));
        assertThrows(IllegalArgumentException.class,()->ReviewActivityFields.from(receipt(id,1,"other")));
        assertThrows(IllegalArgumentException.class,()->ReviewActivityFields.from(receipt(id,1,"reading").put("occurredAt","1")));
    }
}
