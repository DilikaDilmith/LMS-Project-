package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.EnrollmentRequest;
import com.lms.lms_backend.dto.EnrollmentResponse;
import com.lms.lms_backend.model.Course;
import com.lms.lms_backend.model.Enrollment;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.CourseRepository;
import com.lms.lms_backend.repository.EnrollmentRepository;
import com.lms.lms_backend.repository.UserRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    // Student කෙනෙක් Course එකකට Enroll වෙනවා
    public EnrollmentResponse enrollStudent(EnrollmentRequest request, Long studentId) {
        // 1. Student තියෙනවද check කරනවා
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        // 2. Course එක තියෙනවද සහ APPROVEDද කියලා check කරනවා
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        if (course.getStatus() != Course.CourseStatus.APPROVED) {
            throw new RuntimeException("You can only enroll in APPROVED courses!");
        }

        // 3. Institute Isolation check කරනවා (Student ඉන්නේ Course එකේ Institute එකේමද?)
        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("You cannot enroll in courses from other institutes!");
        }

        // 4. දැනටමත් Enroll වෙලාද කියලා check කරනවා
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, course.getId())) {
            throw new RuntimeException("You are already enrolled in this course!");
        }

        // 5. Enrollment එක Save කරනවා
        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(studentId);
        enrollment.setCourseId(course.getId());
        enrollment.setInstituteId(course.getInstituteId());
        enrollment.setStatus(Enrollment.EnrollmentStatus.ACTIVE);

        Enrollment saved = enrollmentRepository.save(enrollment);
        return mapToResponse(saved, course.getName());
    }

    // Student කෙනෙක් Enroll වෙලා තියෙන හැම Course එකම ගන්නවා
    public List<EnrollmentResponse> getEnrollmentsByStudent(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId)
                .stream()
                .map(enrollment -> {
                    Course course = courseRepository.findById(enrollment.getCourseId()).orElse(null);
                    String courseName = course != null ? course.getName() : "Unknown Course";
                    return mapToResponse(enrollment, courseName);
                })
                .collect(Collectors.toList());
    }

    // Institute Admin/ Lecturer ට Course එකක Enroll වුණු Students ගන්න පුළුවන්
    public List<EnrollmentResponse> getEnrollmentsByCourse(Long courseId) {
        // Course එක Institute එකේමද කියලා validate කරනවා
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied to this course!");
        }

        return enrollmentRepository.findByCourseId(courseId)
                .stream()
                .map(enrollment -> mapToResponse(enrollment, course.getName()))
                .collect(Collectors.toList());
    }

    // Helper method
    private EnrollmentResponse mapToResponse(Enrollment enrollment, String courseName) {
        User student = userRepository.findById(enrollment.getStudentId()).orElse(null);
        String studentName = student == null
            ? "Unknown Student"
            : String.format("%s %s", student.getFirstName(), student.getLastName()).trim();
        String studentEmail = student == null ? "" : student.getEmail();

        return new EnrollmentResponse(
                enrollment.getId(),
                enrollment.getStudentId(),
            studentName,
            studentEmail,
                enrollment.getCourseId(),
                courseName,
                enrollment.getInstituteId(),
                enrollment.getStatus(),
                enrollment.getEnrolledAt()
        );
    }
}