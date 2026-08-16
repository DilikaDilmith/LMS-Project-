package com.lms.lms_backend.controller;

import com.lms.lms_backend.dto.EnrollmentRequest;
import com.lms.lms_backend.dto.EnrollmentResponse;
import com.lms.lms_backend.service.EnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    @Autowired
    private EnrollmentService enrollmentService;

    // Student කෙනෙක් Course එකකට Enroll වෙනවා (Student role එක තියෙන්න ඕනේ)
    @PostMapping("/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public EnrollmentResponse enrollStudent(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        
        EnrollmentRequest request = new EnrollmentRequest();
        request.setCourseId(courseId);
        return enrollmentService.enrollStudent(request, studentId);
    }

    // Student කෙනෙක් Enroll වෙලා තියෙන Courses බලන්න
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('INSTITUTE_ADMIN')")
    public List<EnrollmentResponse> getEnrollmentsByStudent(@PathVariable Long studentId) {
        return enrollmentService.getEnrollmentsByStudent(studentId);
    }

    // Course එකකට Enroll වෙලා ඉන්න Students බලන්න (Lecturer/Admin)
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN')")
    public List<EnrollmentResponse> getEnrollmentsByCourse(@PathVariable Long courseId) {
        return enrollmentService.getEnrollmentsByCourse(courseId);
    }
}