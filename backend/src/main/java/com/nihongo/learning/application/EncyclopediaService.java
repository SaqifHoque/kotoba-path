package com.nihongo.learning.application;

import com.nihongo.learning.domain.catalog.CatalogModels.*;
import com.nihongo.learning.domain.port.EncyclopediaRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class EncyclopediaService {
    private final EncyclopediaRepository repository;
    public EncyclopediaService(EncyclopediaRepository repository){this.repository=repository;}
    public Map<String,Object> search(String query,String jlpt,int page,int size){int safeSize=Math.max(1,Math.min(size,100)),safePage=Math.max(page,0);Map<String,Object> response=new LinkedHashMap<>();response.put("items",repository.searchKanji(query,jlpt,safeSize,safePage*safeSize));response.put("total",repository.countKanji(query,jlpt));response.put("page",safePage);response.put("size",safeSize);return response;}
    public KanjiDetail kanji(String character){return repository.findKanji(character).orElseThrow(()->new LessonNotFoundException(character));}
    public RadicalDetail radical(String character){return repository.findRadical(character).orElseThrow(()->new LessonNotFoundException(character));}
    public List<ReadingToken> analyze(String text){if(text==null||text.length()>10000)throw new IllegalArgumentException("Text must contain at most 10,000 characters");List<ReadingToken> tokens=new ArrayList<>();StringBuilder plain=new StringBuilder();for(int cp:text.codePoints().toArray()){String value=new String(Character.toChars(cp));boolean han=Character.UnicodeScript.of(cp)==Character.UnicodeScript.HAN;if(han){flush(tokens,plain);tokens.add(new ReadingToken(value,true,repository.containsKanji(value)));}else plain.append(value);}flush(tokens,plain);return tokens;}
    private void flush(List<ReadingToken> tokens,StringBuilder text){if(text.length()>0){tokens.add(new ReadingToken(text.toString(),false,false));text.setLength(0);}}
}
