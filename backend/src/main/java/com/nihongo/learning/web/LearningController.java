package com.nihongo.learning.web;

import com.nihongo.learning.application.LearningPath;
import com.nihongo.learning.application.LearningService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/learners/{learnerId}")
public class LearningController {
    private final LearningService service;
    public LearningController(LearningService service) { this.service = service; }
    @GetMapping("/path") public LearningPath path(@PathVariable String learnerId) { return service.getPath(learnerId); }
    @PostMapping("/lessons/{lessonId}/complete")
    public LearningPath complete(@PathVariable String learnerId, @PathVariable String lessonId) {
        return service.completeLesson(learnerId, lessonId);
    }
}
