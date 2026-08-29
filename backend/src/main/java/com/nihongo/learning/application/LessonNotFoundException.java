package com.nihongo.learning.application;
public class LessonNotFoundException extends RuntimeException {
    public LessonNotFoundException(String id) { super("Lesson not found: " + id); }
}
