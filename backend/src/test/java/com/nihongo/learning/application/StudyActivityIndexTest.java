package com.nihongo.learning.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:activityindex;MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "nihongo.catalog.import-on-startup=false"})
class StudyActivityIndexTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired StudyActivity activity;
    @Autowired ObjectMapper json;

    private String profile() {
        String id = UUID.randomUUID().toString();
        jdbc.update("insert into study_profile(id,revision,state_json) values(?,0,'{}')",id);
        return id;
    }
    private String insert(String profile, long at, String skill, String kind) {
        String id = UUID.randomUUID().toString();
        String receipt = json.createObjectNode().put("id",id).put("mode","forge").put("subject","k:人").put("label","人")
            .put("kind",kind).put("outcome","incorrect").put("skill",skill).put("occurredAt",at).toString();
        jdbc.update("insert into review_event(profile_id,event_id,kind,outcome,received_at,event_json,occurred_at,skill) values(?,?,?,'incorrect',9999,?,?,?)",
            profile,id,kind,receipt,at,skill);
        return id;
    }

    @Test void indexedSummaryMatchesReceiptOracleAcrossDaysSkillsAndProfiles() throws Exception {
        String owner=profile(), other=profile();
        List<String> ids=new ArrayList<>();
        Random random=new Random(1789);
        for(int i=0;i<1100;i++) ids.add(insert(i%11==0?other:owner,
            random.nextInt(4000),Arrays.asList("meaning","reading","both").get(i%3),i%7==0?"learning":"scheduled"));
        // Reading evidence must be found even when it falls beyond the five-recall cap.
        for(int i=0;i<20;i++)insert(owner,1500,"meaning","scheduled");
        String reading=insert(owner,1501,"reading","scheduled");
        for(long[] window:new long[][]{{0,1000},{1000,2000},{2000,4000},{4000,5000}}) {
            long from=window[0],to=window[1];
            Set<String> requested=new LinkedHashSet<>(Arrays.asList(ids.get(0),ids.get(1),ids.get(2),reading,reading));
            int recalls=0;boolean meaning=false,hasReading=false;
            Set<String> included=new HashSet<>();
            for(String raw:jdbc.queryForList("select event_json from review_event where profile_id=?",String.class,owner)) {
                com.fasterxml.jackson.databind.JsonNode event=json.readTree(raw);
                long at=event.path("occurredAt").asLong();
                if(!event.path("kind").asText().equals("scheduled")||at<from||at>=to)continue;
                recalls++;String skill=event.path("skill").asText();
                meaning|=skill.equals("meaning")||skill.equals("both");
                hasReading|=skill.equals("reading")||skill.equals("both");
                if(requested.contains(event.path("id").asText()))included.add(event.path("id").asText());
            }
            Map<String,Object> result=activity.summarize(owner,from,to,new ArrayList<>(requested));
            assertEquals(Math.min(5,recalls),result.get("recalls"));
            assertEquals(meaning,result.get("meaning"));assertEquals(hasReading,result.get("reading"));
            assertEquals(included,new HashSet<>((Collection<?>)result.get("includedPendingIds")));
        }
    }

    @Test void indexesSupportBothWindowAndMissingSkillProbes() {
        String owner=profile();
        for(int i=0;i<1200;i++)insert(owner,i,"meaning","scheduled");
        assertEquals(false,activity.summarize(owner,0,2000,Collections.emptyList()).get("reading"));
        String day=jdbc.queryForObject("explain select event_id from review_event where profile_id=? and kind='scheduled' and occurred_at>=? and occurred_at<? limit 5",
            String.class,owner,0,2000).toLowerCase(Locale.ROOT);
        String skills=jdbc.queryForObject("explain select event_id from review_event where profile_id=? and kind='scheduled' and skill in ('reading','both') and occurred_at>=? and occurred_at<? limit 1",
            String.class,owner,0,2000).toLowerCase(Locale.ROOT);
        assertTrue(day.contains("review_event_activity_day"),day);
        assertTrue(skills.contains("review_event_activity_skill_day"),skills);
    }
}
