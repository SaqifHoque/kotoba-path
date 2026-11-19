package com.nihongo.learning.application;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Arrays;

/** Version-one receipt projection. Keep this contract compatible with the V5 backfill. */
public final class ReviewActivityFields {
    public final long occurredAt;
    public final String skill;

    private ReviewActivityFields(long occurredAt, String skill) {
        this.occurredAt = occurredAt;
        this.skill = skill;
    }

    public static ReviewActivityFields from(JsonNode receipt) {
        JsonNode at = receipt.path("occurredAt");
        String skill = receipt.path("skill").asText();
        if (!at.isIntegralNumber() || !at.canConvertToLong() || at.asLong() < 0 ||
                at.asLong() > 8640000000000000L || !Arrays.asList("meaning", "reading", "both").contains(skill)) {
            throw new IllegalArgumentException("Invalid version-one activity fields");
        }
        return new ReviewActivityFields(at.asLong(), skill);
    }
}
