package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.StudentLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentLessonProgressRepository extends JpaRepository<StudentLessonProgress, Long> {
    List<StudentLessonProgress> findByStudentId(Long studentId);
    long countByStudentIdAndIsCompletedTrue(Long studentId);
    long countByStudentId(Long studentId);
    boolean existsByStudentIdAndLessonId(Long studentId, Long lessonId);
}