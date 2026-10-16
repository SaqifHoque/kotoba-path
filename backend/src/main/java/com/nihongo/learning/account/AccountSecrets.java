package com.nihongo.learning.account;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/** Passwords are salted; high-entropy bearer/recovery keys are only stored as digests. */
public final class AccountSecrets {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int ITERATIONS = 600000;
    private AccountSecrets() {}

    public static String token() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String digest(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : hash) result.append(String.format("%02x", b & 255));
            return result.toString();
        } catch (Exception e) { throw new IllegalStateException("Digest unavailable", e); }
    }

    public static String hashPassword(String password) {
        byte[] salt = new byte[16]; RANDOM.nextBytes(salt);
        return ITERATIONS + "$" + Base64.getEncoder().encodeToString(salt) + "$"
            + Base64.getEncoder().encodeToString(derive(password, salt, ITERATIONS));
    }

    public static boolean matches(String password, String encoded) {
        String[] parts = encoded.split("\\$");
        return MessageDigest.isEqual(Base64.getDecoder().decode(parts[2]),
            derive(password, Base64.getDecoder().decode(parts[1]), Integer.parseInt(parts[0])));
    }

    private static byte[] derive(String password, byte[] salt, int iterations) {
        char[] chars = password.toCharArray();
        PBEKeySpec spec = new PBEKeySpec(chars, salt, iterations, 256);
        try { return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded(); }
        catch (Exception e) { throw new IllegalStateException("Password hashing unavailable", e); }
        finally { spec.clearPassword(); Arrays.fill(chars, '\0'); }
    }
}
