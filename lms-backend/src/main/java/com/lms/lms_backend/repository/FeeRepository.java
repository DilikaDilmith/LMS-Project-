package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Fee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FeeRepository extends JpaRepository<Fee, Long> {
    List<Fee> findByStudentId(Long studentId);
    List<Fee> findByCourseId(Long courseId);
    Optional<Fee> findByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Fee> findByStudentIdAndStatus(Long studentId, Fee.FeeStatus status);
}