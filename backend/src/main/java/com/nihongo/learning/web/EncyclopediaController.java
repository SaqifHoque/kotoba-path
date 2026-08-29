package com.nihongo.learning.web;

import com.nihongo.learning.application.EncyclopediaService;
import com.nihongo.learning.domain.catalog.CatalogModels.*;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.*;

@RestController
@RequestMapping("/api/encyclopedia")
public class EncyclopediaController {
    private final EncyclopediaService service;
    public EncyclopediaController(EncyclopediaService service){this.service=service;}
    @GetMapping("/kanji") public Map<String,Object> search(@RequestParam(defaultValue="")String query,@RequestParam(defaultValue="")String jlpt,@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="24")int size){return service.search(query,jlpt,page,size);}
    @GetMapping("/kanji/{character}") public KanjiDetail kanji(@PathVariable String character){return service.kanji(character);}
    @GetMapping("/radicals/{character}") public RadicalDetail radical(@PathVariable String character){return service.radical(character);}
    @PostMapping("/reader/analyze") public List<ReadingToken> analyze(@Valid @RequestBody AnalyzeRequest request){return service.analyze(request.text);}
    public static final class AnalyzeRequest {@NotNull @Size(max=10000) public String text; public String getText(){return text;} public void setText(String text){this.text=text;}}
}
