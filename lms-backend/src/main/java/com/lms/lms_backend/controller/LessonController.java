package com.lms.lms_backend.controller;

import com.lms.lms_backend.dto.LessonRequest;
import com.lms.lms_backend.dto.LessonResponse;
import com.lms.lms_backend.service.LessonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    @Autowired
    private LessonService lessonService;

    @PostMapping
    @PreAuthorize("hasRole('LECTURER')")
    public LessonResponse createLesson(@RequestBody LessonRequest request) {
        return lessonService.createLesson(request);
    }

    @GetMapping("/module/{moduleId}")
    public List<LessonResponse> getLessonsByModule(@PathVariable Long moduleId) {
        return lessonService.getLessonsByModule(moduleId);
    }

    @GetMapping("/module/{moduleId}/published")
    public List<LessonResponse> getPublishedLessons(@PathVariable Long moduleId) {
        return lessonService.getPublishedLessonsByModule(moduleId);
    }

    @PutMapping("/{lessonId}")
    @PreAuthorize("hasRole('LECTURER')")
    public LessonResponse updateLesson(@PathVariable Long lessonId, @RequestBody LessonRequest request) {
        return lessonService.updateLesson(lessonId, request);
    }

    @DeleteMapping("/{lessonId}")
    @PreAuthorize("hasRole('LECTURER')")
    public String deleteLesson(@PathVariable Long lessonId) {
        lessonService.deleteLesson(lessonId);
        return "Lesson deleted successfully!";
    }
}