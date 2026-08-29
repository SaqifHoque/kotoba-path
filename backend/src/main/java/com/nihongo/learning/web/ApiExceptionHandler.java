package com.nihongo.learning.web;

import com.nihongo.learning.application.LessonLockedException;
import com.nihongo.learning.application.LessonNotFoundException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(LessonNotFoundException.class)
    ResponseEntity<Map<String, String>> missing(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", ex.getMessage()));
    }
    @ExceptionHandler(LessonLockedException.class)
    ResponseEntity<Map<String, String>> locked(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Collections.singletonMap("message", ex.getMessage()));
    }
}
