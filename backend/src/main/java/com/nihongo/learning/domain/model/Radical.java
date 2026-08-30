package com.nihongo.learning.domain.model;

import java.util.Objects;

public final class Radical {
    private final String character;
    private final String meaning;
    private final String mnemonic;

    public Radical(String character, String meaning, String mnemonic) {
        this.character = Objects.requireNonNull(character);
        this.meaning = Objects.requireNonNull(meaning);
        this.mnemonic = Objects.requireNonNull(mnemonic);
    }
    public String getCharacter() { return character; }
    public String getMeaning() { return meaning; }
    public String getMnemonic() { return mnemonic; }
}
