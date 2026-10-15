package com.nihongo.learning.account;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AccountThrottle {
    private final JdbcTemplate jdbc;
    public AccountThrottle(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Shared across instances, and committed even when authentication fails. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean allow(String address) {
        long now = System.currentTimeMillis(), start = now / 600000 * 600000;
        String key = AccountSecrets.digest(address);
        jdbc.update("delete from account_rate_limit where window_start < ?", start);
        // An atomic upsert works in PostgreSQL and the development H2 PostgreSQL mode.
        try { jdbc.update("insert into account_rate_limit(address_hash,window_start,attempts) values(?,?,0) on conflict do nothing", key, start); }
        catch (DuplicateKeyException ignored) { /* Existing bucket. */ }
        return jdbc.update("update account_rate_limit set attempts=attempts+1 where address_hash=? and window_start=? and attempts<20", key, start) == 1;
    }
}
