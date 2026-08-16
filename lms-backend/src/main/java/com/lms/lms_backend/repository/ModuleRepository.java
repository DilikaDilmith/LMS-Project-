package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findByCourseIdOrderByOrderIndexAsc(Long courseId);
    boolean existsByCourseIdAndTitle(Long courseId, String title);
}