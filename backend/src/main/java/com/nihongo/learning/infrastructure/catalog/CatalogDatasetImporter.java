package com.nihongo.learning.infrastructure.catalog;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.csv.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name="nihongo.catalog.import-on-startup",havingValue="true",matchIfMissing=true)
public class CatalogDatasetImporter implements ApplicationRunner {
    private final JdbcTemplate jdbc; private final ObjectMapper json;
    public CatalogDatasetImporter(JdbcTemplate jdbc,ObjectMapper json){this.jdbc=jdbc;this.json=json;}
    @Override @Transactional public void run(ApplicationArguments args) throws Exception {
        Integer existing=jdbc.queryForObject("select count(*) from kanji",Integer.class); if(existing!=null&&existing>0)return;
        Map<String,Long> radicalIds=importRadicals();
        Map<String,List<String>> components=readComponents();
        List<CSVRecord> records=readCsv("datasets/ka_data.csv");
        Set<String> target=records.stream().map(r->r.get("kanji")).collect(Collectors.toCollection(LinkedHashSet::new));
        Map<String,Integer> wordRanks=readWordRanks(); Map<String,Integer> kanjiRanks=rankKanji(target,wordRanks);
        Map<String,String> radicalMeanings=jdbc.query("select character,meaning from radical",rs->{Map<String,String> m=new HashMap<>();while(rs.next())m.put(rs.getString(1),rs.getString(2));return m;});
        for(CSVRecord record:records) importKanji(record,components.getOrDefault(record.get("kanji"),Collections.emptyList()),kanjiRanks.get(record.get("kanji")),wordRanks,radicalIds,radicalMeanings);
        importStarterSentences();
    }
    private List<CSVRecord> readCsv(String path)throws IOException{
        try(Reader reader=new InputStreamReader(new ClassPathResource(path).getInputStream(),StandardCharsets.UTF_8)){
            return CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader).getRecords();
        }
    }
    private Map<String,Long> importRadicals()throws IOException{
        Map<String,Long> ids=new HashMap<>(); for(CSVRecord r:readCsv("datasets/japanese-radicals.csv")){
            String ch=clean(r.get("Radical")); if(ch.isEmpty())continue; String file=clean(r.get("R-Filename"));
            Integer matches=jdbc.queryForObject("select count(*) from radical where character=?",Integer.class,ch);
            if(matches==null||matches==0) jdbc.update("insert into radical(character,name_japanese,name_romaji,meaning,stroke_count,position_name,image_filename,important) values(?,?,?,?,?,?,?,?)",ch,clean(r.get("Reading-J")),clean(r.get("Reading-R")),clean(r.get("Meaning")),integer(r.get("Stroke#")),clean(r.get("Position-R")),file.isEmpty()?null:file+".svg",integer(r.get("Radical ID#"))<=214);
            ids.put(ch,id("radical",ch));
        } return ids;
    }
    private Map<String,List<String>> readComponents()throws IOException{
        Map<String,List<String>> map=new HashMap<>(); try(BufferedReader br=new BufferedReader(new InputStreamReader(new ClassPathResource("datasets/components-kc.csv").getInputStream(),StandardCharsets.UTF_8))){
            String line; while((line=br.readLine())!=null){int comma=line.indexOf(',');if(comma<1)continue;String k=line.substring(0,comma);String raw=line.substring(comma+1).trim();List<String> parts=raw.codePoints().mapToObj(cp->new String(Character.toChars(cp))).filter(s->!s.trim().isEmpty()).distinct().collect(Collectors.toList());map.put(k,parts);}
        }return map;
    }
    private Map<String,Integer> readWordRanks()throws IOException{
        Map<String,Integer> ranks=new HashMap<>();try(BufferedReader br=new BufferedReader(new InputStreamReader(new ClassPathResource("datasets/wordlex-2011.txt").getInputStream(),StandardCharsets.UTF_8))){String line;int n=0;while((line=br.readLine())!=null){n++;ranks.putIfAbsent(line.trim(),n);}}return ranks;
    }
    private Map<String,Integer> rankKanji(Set<String> target,Map<String,Integer> words){
        Map<String,Integer> first=new HashMap<>();for(Map.Entry<String,Integer> e:words.entrySet())for(int cp:e.getKey().codePoints().toArray()){String c=new String(Character.toChars(cp));if(target.contains(c))first.merge(c,e.getValue(),Math::min);}
        List<String> ordered=new ArrayList<>(target);ordered.sort(Comparator.comparingInt(c->first.getOrDefault(c,Integer.MAX_VALUE)));Map<String,Integer> result=new HashMap<>();for(int i=0;i<ordered.size();i++)result.put(ordered.get(i),i+1);return result;
    }
    private void importKanji(CSVRecord r,List<String> parts,int rank,Map<String,Integer> wordRanks,Map<String,Long> radicalIds,Map<String,String> meanings)throws IOException{
        String ch=r.get("kanji"), meaning=clean(r.get("kmeaning")), primary=clean(r.get("radical")); int grade=integer(r.get("kgrade"));
        List<String> actual=parts.isEmpty()?Collections.singletonList(primary):parts;
        String joined=actual.stream().map(p->p+" ("+meanings.getOrDefault(p,"visual component")+")").collect(Collectors.joining(" + "));
        String mnemonic="Memory story—not historical etymology: picture "+joined+". Use these real visual parts as a bridge to “"+meaning+".”";
        jdbc.update("insert into kanji(character,meaning,onyomi,kunyomi,frequency_rank,jlpt_level,jlpt_estimated,grade,mnemonic,primary_radical_id) values(?,?,?,?,?,?,?,?,?,?)",ch,meaning,clean(r.get("onyomi_ja")),clean(r.get("kunyomi_ja")),rank,jlpt(grade),true,grade,mnemonic,radicalIds.get(primary));
        long kanjiId=id("kanji",ch);int order=0;for(String part:actual){Long rid=radicalIds.get(part);jdbc.update("insert into component(character,meaning,radical_id) select ?,?,? where not exists(select 1 from component where character=?)",part,meanings.getOrDefault(part,"visual component"),rid,part);Long cid=jdbc.queryForObject("select id from component where character=?",Long.class,part);jdbc.update("insert into kanji_component(kanji_id,component_id,display_order) values(?,?,?)",kanjiId,cid,order++);}
        List<List<String>> examples=json.readValue(r.get("examples"),new TypeReference<List<List<String>>>(){});int wordOrder=0;for(List<String> ex:examples){if(ex.size()<2)continue;ParsedWord word=parseWord(ex.get(0));Integer frequency=wordRanks.get(word.expression);jdbc.update("insert into word(expression,reading,meaning,frequency_rank) select ?,?,?,? where not exists(select 1 from word where expression=? and reading=?)",word.expression,word.reading,ex.get(1),frequency,word.expression,word.reading);Long wid=jdbc.queryForObject("select id from word where expression=? and reading=?",Long.class,word.expression,word.reading);jdbc.update("insert into kanji_word(kanji_id,word_id,contribution,display_order) values(?,?,?,?)",kanjiId,wid,"The character "+ch+" contributes the idea “"+meaning+".”",wordOrder++);}
    }
    private void importStarterSentences(){
        sentence("私は学生です。","わたし は がくせい です。","I am a student.","curated starter");
        sentence("朝、学校へ行きます。","あさ、がっこう へ いきます。","In the morning, I go to school.","curated starter");
        sentence("午後は家で休みます。","ごご は いえ で やすみます。","In the afternoon, I rest at home.","curated starter");
    }
    private void sentence(String jp,String reading,String en,String source){jdbc.update("insert into sentence(japanese,reading,english,source_name) values(?,?,?,?)",jp,reading,en,source);Long sid=jdbc.queryForObject("select id from sentence where japanese=?",Long.class,jp);for(int cp:jp.codePoints().toArray()){String c=new String(Character.toChars(cp));List<Long> ids=jdbc.query("select id from kanji where character=?",(rs,n)->rs.getLong(1),c);if(!ids.isEmpty())jdbc.update("insert into kanji_sentence(kanji_id,sentence_id) select ?,? where not exists(select 1 from kanji_sentence where kanji_id=? and sentence_id=?)",ids.get(0),sid,ids.get(0),sid);}}
    private long id(String table,String character){return Objects.requireNonNull(jdbc.queryForObject("select id from "+table+" where character=?",Long.class,character));}
    private int integer(String v){try{return Integer.parseInt(clean(v));}catch(Exception e){return 0;}}
    private String clean(String value){if(value==null||"n/a".equalsIgnoreCase(value.trim()))return "";return value.replace('\u00a0',' ').trim();}
    private String jlpt(int grade){if(grade<=1)return "N5";if(grade==2)return "N4";if(grade<=4)return "N3";if(grade<=6)return "N2";return "N1";}
    private ParsedWord parseWord(String raw){int open=raw.lastIndexOf('（'),close=raw.lastIndexOf('）');return open>0&&close>open?new ParsedWord(raw.substring(0,open),raw.substring(open+1,close)):new ParsedWord(raw,"");}
    private static final class ParsedWord{final String expression,reading;ParsedWord(String e,String r){expression=e;reading=r;}}
}
