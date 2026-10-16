package com.nihongo.learning.account;

import java.util.*;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {
    private static final long SESSION_SECONDS = 30 * 86400;
    private final JdbcTemplate jdbc;
    private final String dummyPassword = AccountSecrets.hashPassword(AccountSecrets.token());
    public AccountService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Map<String, Object> current(HttpServletRequest request) {
        String token = cookie(request, "kotoba_session");
        if (token == null) return null;
        List<Map<String, Object>> rows = jdbc.queryForList(
            "select a.id,a.username,a.profile_id from learner_account a join account_session s on s.account_id=a.id where s.token_hash=? and s.expires_at>?",
            AccountSecrets.digest(token), System.currentTimeMillis());
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired. Sign in again.");
        return rows.get(0);
    }

    public String studyProfile(HttpServletRequest request, String anonymousId) {
        Map<String, Object> account = current(request);
        String owner = account == null ? "guest" : (String) account.get("id");
        String expected = request.getHeader("X-Kotoba-Owner");
        // Account writes require an identity binding so an old tab cannot upload another user's cache.
        if ((expected != null && !owner.equals(expected)) || (account != null && "PUT".equals(request.getMethod()) && expected == null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account changed. Reload before studying.");
        }
        if (account != null) return (String) account.get("profile_id");
        return unclaimed(anonymousId) ? anonymousId : null;
    }

    public boolean unclaimed(String id) {
        return id != null && id.matches("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}")
            && jdbc.queryForObject("select count(*) from study_profile p where id=? and not exists (select 1 from learner_account a where a.profile_id=p.id)", Integer.class, id) == 1;
    }

    @Transactional
    public Map<String, String> register(String username, String password, HttpServletRequest request, HttpServletResponse response) {
        if (current(request) != null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Sign out before creating an account.");
        username = username(username); validatePassword(password);
        String profile = cookie(request, "kotoba_profile");
        if (!unclaimed(profile)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Load and save your learning path before creating an account.");
        jdbc.queryForList("select id from study_profile where id=? for update", profile);
        if (!unclaimed(profile)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Profile already claimed.");
        if (jdbc.queryForObject("select count(*) from learner_account where username=?", Integer.class, username) > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Choose another username.");
        String id = UUID.randomUUID().toString(), recovery = AccountSecrets.token();
        jdbc.update("insert into learner_account(id,username,password_hash,recovery_hash,profile_id) values(?,?,?,?,?)",
            id, username, AccountSecrets.hashPassword(password), AccountSecrets.digest(recovery), profile);
        startSession(id, request, response);
        clearGuest(response, request);
        return result(id, username, recovery);
    }

    @Transactional
    public Map<String, String> login(String username, String password, HttpServletRequest request, HttpServletResponse response) {
        username = username(username); validatePasswordInput(password);
        // Serialize password verification with recovery so an old password cannot create a new session after reset.
        List<Map<String, Object>> rows = jdbc.queryForList("select id,password_hash from learner_account where username=? for update", username);
        String hash = rows.isEmpty() ? dummyPassword : (String) rows.get(0).get("password_hash");
        boolean matches = AccountSecrets.matches(password, hash);
        if (!matches || rows.isEmpty()) throw invalidCredentials();
        String id = (String) rows.get(0).get("id");
        startSession(id, request, response);
        clearGuest(response, request);
        return result(id, username, null);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String token = cookie(request, "kotoba_session");
        if (token != null) jdbc.update("delete from account_session where token_hash=?", AccountSecrets.digest(token));
        response.addHeader("Set-Cookie", sessionCookie("", 0, request)); clearGuest(response, request);
    }

    private void startSession(String id, HttpServletRequest request, HttpServletResponse response) {
        String previous = cookie(request, "kotoba_session");
        if (previous != null) jdbc.update("delete from account_session where token_hash=?", AccountSecrets.digest(previous));
        jdbc.update("delete from account_session where expires_at<=?", System.currentTimeMillis());
        String token = AccountSecrets.token();
        jdbc.update("insert into account_session(token_hash,account_id,expires_at) values(?,?,?)", AccountSecrets.digest(token), id, System.currentTimeMillis() + SESSION_SECONDS * 1000);
        response.addHeader("Set-Cookie", sessionCookie(token, SESSION_SECONDS, request));
    }
    private String sessionCookie(String value, long seconds, HttpServletRequest request) {
        return ResponseCookie.from("kotoba_session", value).httpOnly(true).secure(request.isSecure()).sameSite("Strict").path("/api").maxAge(seconds).build().toString();
    }
    private void clearGuest(HttpServletResponse response, HttpServletRequest request) {
        response.addHeader("Set-Cookie", ResponseCookie.from("kotoba_profile", "").httpOnly(true).secure(request.isSecure()).sameSite("Strict").path("/api/study-profile").maxAge(0).build().toString());
    }
    public static String cookie(HttpServletRequest request, String name) {
        if (request.getCookies() != null) for (Cookie cookie : request.getCookies()) if (name.equals(cookie.getName())) return cookie.getValue();
        return null;
    }
    private String username(String value) {
        if (value == null || !value.matches("[A-Za-z0-9_]{3,40}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use 3–40 letters, numbers, or underscores for your username.");
        return value.toLowerCase(Locale.ROOT);
    }
    private void validatePassword(String password) {
        validatePasswordInput(password);
        if (password.length() < 15) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a password of 15–128 characters.");
    }
    private void validatePasswordInput(String password) {
        if (password == null || password.isEmpty() || password.length() > 128) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a password of 15–128 characters.");
    }
    private ResponseStatusException invalidCredentials() { return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect username or credentials."); }
    private Map<String, String> result(String id, String username, String recovery) {
        Map<String, String> result = new LinkedHashMap<>(); result.put("id", id); result.put("username", username);
        if (recovery != null) result.put("recoveryKey", recovery);
        return result;
    }
}
