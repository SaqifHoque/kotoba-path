package com.nihongo.learning.web;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Map;
@RestController
public class HealthController {
    private final JdbcTemplate jdbc;
    public HealthController(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @GetMapping("/api/health") public Map<String, String> health() {
        jdbc.queryForObject("select 1", Integer.class);
        return Map.of("status", "up", "storage", "postgresql");
    }
}
