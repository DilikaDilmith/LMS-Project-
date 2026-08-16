package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByModuleIdOrderByOrderIndexAsc(Long moduleId);
    List<Lesson> findByModuleIdAndIsPublishedTrue(Long moduleId);
}