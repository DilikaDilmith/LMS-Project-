package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findByCourseId(Long courseId);
    List<Attendance> findByStudentIdAndCourseId(Long studentId, Long courseId);
    Optional<Attendance> findByStudentIdAndCourseIdAndDate(Long studentId, Long courseId, LocalDate date);

    // Count total classes for a student in a course
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.studentId = :studentId AND a.courseId = :courseId")
    Long countTotalClasses(@Param("studentId") Long studentId, @Param("courseId") Long courseId);

    // Count present/absent/late by status
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.studentId = :studentId AND a.courseId = :courseId AND a.status = :status")
    Long countByStatus(@Param("studentId") Long studentId, @Param("courseId") Long courseId, @Param("status") Attendance.AttendanceStatus status);
}