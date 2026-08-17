package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.StudentLessonProgress;
import com.lms.lms_backend.repository.StudentLessonProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    @Autowired
    private StudentLessonProgressRepository progressRepository;

    @PostMapping("/lesson/{lessonId}/complete/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public String completeLesson(@PathVariable Long lessonId, @PathVariable Long studentId) {
        if (progressRepository.existsByStudentIdAndLessonId(studentId, lessonId)) {
            return "Already completed";
        }
        StudentLessonProgress progress = new StudentLessonProgress();
        progress.setStudentId(studentId);
        progress.setLessonId(lessonId);
        progress.setIsCompleted(true);
        progressRepository.save(progress);
        return "Lesson marked as completed";
    }
}