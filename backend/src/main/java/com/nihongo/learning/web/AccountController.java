package com.nihongo.learning.web;

import com.nihongo.learning.account.AccountService;
import com.nihongo.learning.account.AccountThrottle;
import java.util.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AccountController {
    private final AccountService accounts;
    private final AccountThrottle throttle;
    public AccountController(AccountService accounts, AccountThrottle throttle) { this.accounts = accounts; this.throttle = throttle; }

    @GetMapping("/account")
    public Map<String, String> current(HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        Map<String, Object> account;
        try { account = accounts.current(request); }
        catch (ResponseStatusException e) {
            if (e.getStatus() != HttpStatus.UNAUTHORIZED) throw e;
            accounts.logout(request, response); account = null;
        }
        if (account == null) return Collections.singletonMap("id", "guest");
        Map<String, String> result = new LinkedHashMap<>(); result.put("id", (String) account.get("id")); result.put("username", (String) account.get("username"));
        return result;
    }

    public static class Credentials { public String username; public String password; }

    @PostMapping(path="/study-profile/register", consumes="application/json")
    public Map<String, String> register(@RequestBody Credentials body, HttpServletRequest request, HttpServletResponse response) {
        protect(request, response, true);
        try { return accounts.register(body.username, body.password, request, response); }
        catch (org.springframework.dao.DuplicateKeyException e) { throw new ResponseStatusException(HttpStatus.CONFLICT, "Choose another username."); }
    }
    @PostMapping(path="/account/login", consumes="application/json")
    public Map<String, String> login(@RequestBody Credentials body, HttpServletRequest request, HttpServletResponse response) {
        protect(request, response, true); return accounts.login(body.username, body.password, request, response);
    }
    @PostMapping("/account/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        protect(request, response, false); accounts.logout(request, response);
    }
    private void protect(HttpServletRequest request, HttpServletResponse response, boolean limited) {
        response.setHeader("Cache-Control", "no-store");
        if (!"1".equals(request.getHeader("X-Kotoba-Request")) || "cross-site".equals(request.getHeader("Sec-Fetch-Site")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (limited && !throttle.allow(request.getRemoteAddr())) {
            response.setHeader("Retry-After", "600"); throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Try again in ten minutes.");
        }
    }
}
