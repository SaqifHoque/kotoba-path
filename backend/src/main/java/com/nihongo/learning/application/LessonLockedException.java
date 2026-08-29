package com.nihongo.learning.application;
public class LessonLockedException extends RuntimeException {
    public LessonLockedException(String id) { super("Complete earlier lessons before: " + id); }
}
