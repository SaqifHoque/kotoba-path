package com.nihongo.learning.infrastructure.catalog;

import com.nihongo.learning.domain.catalog.CatalogModels.*;
import com.nihongo.learning.domain.port.EncyclopediaRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class JdbcEncyclopediaRepository implements EncyclopediaRepository {
    private final JdbcTemplate jdbc;
    public JdbcEncyclopediaRepository(JdbcTemplate jdbc){this.jdbc=jdbc;}
    private KanjiSummary summary(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new KanjiSummary(rs.getString("character"),rs.getString("meaning"),rs.getString("onyomi"),rs.getString("kunyomi"),rs.getInt("frequency_rank"),rs.getString("jlpt_level"));
    }
    private Object value(Map<String,Object> row,String key){if(row.containsKey(key))return row.get(key);String upper=key.toUpperCase();if(row.containsKey(upper))return row.get(upper);return row.get(key.toLowerCase());}
    @Override public List<KanjiSummary> searchKanji(String query,String jlpt,int limit,int offset){
        String q=query==null?"":query.trim().toLowerCase(); String level=jlpt==null?"":jlpt.trim().toUpperCase();
        return jdbc.query("select character,meaning,onyomi,kunyomi,frequency_rank,jlpt_level from kanji where (?='' or lower(character) like ? or lower(meaning) like ? or lower(onyomi) like ? or lower(kunyomi) like ?) and (?='' or jlpt_level=?) order by frequency_rank limit ? offset ?",
            (rs,n)->summary(rs),q,"%"+q+"%","%"+q+"%","%"+q+"%","%"+q+"%",level,level,limit,offset);
    }
    @Override public long countKanji(String query,String jlpt){
        String q=query==null?"":query.trim().toLowerCase(); String level=jlpt==null?"":jlpt.trim().toUpperCase();
        Long value=jdbc.queryForObject("select count(*) from kanji where (?='' or lower(character) like ? or lower(meaning) like ? or lower(onyomi) like ? or lower(kunyomi) like ?) and (?='' or jlpt_level=?)",Long.class,q,"%"+q+"%","%"+q+"%","%"+q+"%","%"+q+"%",level,level); return value==null?0:value;
    }
    @Override public Optional<KanjiDetail> findKanji(String c){
        List<Map<String,Object>> rows=jdbc.queryForList("select k.*,r.character primary_radical from kanji k left join radical r on r.id=k.primary_radical_id where k.character=?",c);
        if(rows.isEmpty())return Optional.empty(); Map<String,Object> r=rows.get(0); long id=((Number)value(r,"id")).longValue();
        KanjiSummary s=new KanjiSummary((String)value(r,"character"),(String)value(r,"meaning"),(String)value(r,"onyomi"),(String)value(r,"kunyomi"),((Number)value(r,"frequency_rank")).intValue(),(String)value(r,"jlpt_level"));
        List<ComponentView> components=jdbc.query("select c.character,c.meaning,rd.image_filename from kanji_component kc join component c on c.id=kc.component_id left join radical rd on rd.id=c.radical_id where kc.kanji_id=? order by kc.display_order",(rs,n)->new ComponentView(rs.getString(1),rs.getString(2),rs.getString(3)),id);
        List<WordView> words=jdbc.query("select w.expression,w.reading,w.meaning,w.frequency_rank,kw.contribution from kanji_word kw join word w on w.id=kw.word_id where kw.kanji_id=? order by coalesce(w.frequency_rank,999999),kw.display_order limit 12",(rs,n)->new WordView(rs.getString(1),rs.getString(2),rs.getString(3),(Integer)rs.getObject(4),rs.getString(5)),id);
        List<SentenceView> sentences=jdbc.query("select s.japanese,s.reading,s.english,s.source_name from kanji_sentence ks join sentence s on s.id=ks.sentence_id where ks.kanji_id=? limit 8",(rs,n)->new SentenceView(rs.getString(1),rs.getString(2),rs.getString(3),rs.getString(4)),id);
        List<KanjiSummary> related=jdbc.query("select distinct k.character,k.meaning,k.onyomi,k.kunyomi,k.frequency_rank,k.jlpt_level from kanji k join kanji_component kc on kc.kanji_id=k.id where kc.component_id in (select component_id from kanji_component where kanji_id=?) and k.id<>? order by k.frequency_rank limit 10",(rs,n)->summary(rs),id,id);
        return Optional.of(new KanjiDetail(s,(String)value(r,"mnemonic"),(String)value(r,"primary_radical"),Boolean.TRUE.equals(value(r,"jlpt_estimated")),components,words,sentences,related));
    }
    @Override public Optional<RadicalDetail> findRadical(String c){
        List<Map<String,Object>> rows=jdbc.queryForList("select * from radical where character=?",c); if(rows.isEmpty())return Optional.empty(); Map<String,Object> r=rows.get(0); long id=((Number)value(r,"id")).longValue();
        List<KanjiSummary> list=jdbc.query("select distinct k.character,k.meaning,k.onyomi,k.kunyomi,k.frequency_rank,k.jlpt_level from kanji k left join kanji_component kc on kc.kanji_id=k.id left join component c on c.id=kc.component_id where k.primary_radical_id=? or c.radical_id=? order by k.frequency_rank limit 60",(rs,n)->summary(rs),id,id);
        return Optional.of(new RadicalDetail((String)value(r,"character"),(String)value(r,"name_japanese"),(String)value(r,"name_romaji"),(String)value(r,"meaning"),(Integer)value(r,"stroke_count"),(String)value(r,"position_name"),(String)value(r,"image_filename"),list));
    }
    @Override public boolean containsKanji(String c){Integer n=jdbc.queryForObject("select count(*) from kanji where character=?",Integer.class,c);return n!=null&&n>0;}
}
