package com.nihongo.learning.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import java.text.Normalizer;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Per-subject preference timestamps are independent from review counters and Forge settings. */
public final class MeaningSynonymPolicy {
    private MeaningSynonymPolicy() {}
    public static void validate(JsonNode entries) {
        require(entries.isObject() && entries.size() <= 6000);
        entries.fields().forEachRemaining(entry -> {
            require(entry.getKey().matches("[rkv]:.{1,198}"));
            JsonNode value = entry.getValue(), at = value.path("updatedAt"), values = value.path("values");
            require(value.isObject() && value.size() == 2 && at.isIntegralNumber() && at.canConvertToLong() && at.asLong() >= 0 && at.asLong() <= 8640000000000000L);
            require(values.isArray() && values.size() <= 8);
            Set<String> seen = new HashSet<>();
            for (JsonNode alias : values) {
                require(alias.isTextual()); String text = alias.asText(), normalized = normalize(text);
                require(!text.trim().isEmpty() && text.length() <= 80 && text.equals(text.trim()) && seen.add(normalized));
                require(text.codePoints().noneMatch(Character::isISOControl));
                require(normalized.codePoints().anyMatch(Character::isLetterOrDigit));
                require(normalized.codePoints().noneMatch(c -> Character.isLetter(c) && Character.UnicodeScript.of(c) != Character.UnicodeScript.LATIN));
            }
        });
    }
    private static String normalize(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT)
            .replaceAll("(?i)\\[(?:n|adj|adv|v|v\\.t|v\\.i|pron|pref|suf)\\.?\\]|\\((?:n|adj|adv|v|v\\.t|v\\.i|pron|pref|suf)\\.?\\)", "")
            .replace('’', '\'').replace('‘', '\'').replaceAll("[‐‑–—-]", " ").replace("&", " and ")
            .replaceAll("[^\\p{L}\\p{M}\\p{N}' ]", " ").trim().replaceAll("\\s+", " ").replaceFirst("^(?:to|an?|the)\\s+", "");
    }
    public static ObjectNode merge(ObjectMapper json, JsonNode saved, JsonNode incoming) {
        ObjectNode result = json.createObjectNode();
        if (saved != null && saved.isObject()) saved.fields().forEachRemaining(e -> result.set(e.getKey(), canonical(e.getValue())));
        if (incoming != null && incoming.isObject()) incoming.fields().forEachRemaining(e -> {
            JsonNode old = result.get(e.getKey()), next = canonical(e.getValue());
            if (old == null || wins(next, old)) result.set(e.getKey(), next);
        });
        validate(result);
        return result;
    }
    private static JsonNode canonical(JsonNode entry) {
        ObjectNode result = entry.deepCopy();
        List<String> values = new ArrayList<>(); entry.path("values").forEach(value -> values.add(value.asText()));
        Collections.sort(values);
        result.putArray("values").addAll(values.stream().map(com.fasterxml.jackson.databind.node.TextNode::valueOf).collect(java.util.stream.Collectors.toList()));
        return result;
    }
    private static boolean wins(JsonNode next, JsonNode old) {
        long a = next.path("updatedAt").asLong(), b = old.path("updatedAt").asLong();
        if (a != b) return a > b;
        boolean emptyNext = next.path("values").isEmpty(), emptyOld = old.path("values").isEmpty();
        if (emptyNext != emptyOld) return emptyNext; // Equal-time removals must not resurrect aliases.
        return fingerprint(next).compareTo(fingerprint(old)) > 0;
    }
    private static String fingerprint(JsonNode entry) {
        List<String> values = new ArrayList<>(); entry.path("values").forEach(value -> values.add(value.asText()));
        return String.join("\0", values);
    }
    private static void require(boolean valid) {
        if (!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid personal meaning synonyms");
    }
}
