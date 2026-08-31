package com.nihongo.learning.domain.port;

import com.nihongo.learning.domain.catalog.CatalogModels.*;
import java.util.List;
import java.util.Optional;

public interface EncyclopediaRepository {
    List<KanjiSummary> searchKanji(String query, String jlpt, int limit, int offset);
    long countKanji(String query, String jlpt);
    Optional<KanjiDetail> findKanji(String character);
    Optional<RadicalDetail> findRadical(String character);
    boolean containsKanji(String character);
}
