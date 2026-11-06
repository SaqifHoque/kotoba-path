package com.nihongo.learning.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Only known UI routes forward; missing API/assets must keep their real 404. */
@Controller
public class SpaController {
    @GetMapping({"/", "/learn", "/learn/**", "/forge", "/forge/**", "/encyclopedia", "/encyclopedia/**", "/settings", "/settings/**", "/study", "/study/**", "/account", "/account/**", "/reviews", "/reviews/**", "/kanji", "/kanji/**", "/practice", "/practice/**", "/reader", "/reader/**"})
    public String index() { return "forward:/index.html"; }
}
