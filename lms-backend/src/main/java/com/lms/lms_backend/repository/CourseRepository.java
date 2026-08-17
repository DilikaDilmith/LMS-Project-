package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByInstituteId(Long instituteId);

    List<Course> findByLecturerId(Long lecturerId);

    List<Course> findByStatus(Course.CourseStatus status);

    List<Course> findByInstituteIdAndStatus(Long instituteId, Course.CourseStatus status);

    boolean existsByNameAndInstituteId(String name, Long instituteId);
}