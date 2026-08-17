package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.dto.CourseRequest;
import com.lms.lms_backend.dto.CourseResponse;
import com.lms.lms_backend.service.CourseService;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @PostMapping
    @PreAuthorize("hasRole('LECTURER')")
    @Auditable(action = "CREATE_COURSE", description = "Lecturer creates a course")
    public CourseResponse createCourse(@RequestBody CourseRequest request) {
        return courseService.createCourse(request);
    }

    @PostMapping("/{courseId}/submit")
    @PreAuthorize("hasRole('LECTURER')")
    @Auditable(action = "SUBMIT_COURSE", description = "Lecturer submits course for approval")
    public CourseResponse submitForApproval(@PathVariable Long courseId) {
        return courseService.submitForApproval(courseId);
    }

    @PostMapping("/{courseId}/approve")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN')")
    @Auditable(action = "APPROVE_COURSE", description = "Institute Admin approves a course")
    public CourseResponse approveCourse(@PathVariable Long courseId) {
        return courseService.approveCourse(courseId);
    }

    @PostMapping("/{courseId}/reject")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN')")
    @Auditable(action = "REJECT_COURSE", description = "Institute Admin rejects a course")
    public CourseResponse rejectCourse(@PathVariable Long courseId, @RequestParam String reason) {
        return courseService.rejectCourse(courseId, reason);
    }

    @GetMapping
    public List<CourseResponse> getCoursesForCurrentInstitute() {
        Long instituteId = TenantContext.getInstituteId();
        if (instituteId == null) {
            throw new RuntimeException("Institute context not found!");
        }
        return courseService.getCoursesByInstitute(instituteId);
    }

    @GetMapping("/approved")
    public List<CourseResponse> getApprovedCourses() {
        Long instituteId = TenantContext.getInstituteId();
        if (instituteId == null) {
            throw new RuntimeException("Institute context not found!");
        }
        return courseService.getApprovedCoursesByInstitute(instituteId);
    }

    @GetMapping("/lecturer/{lecturerId}")
    @PreAuthorize("hasRole('LECTURER')")
    public List<CourseResponse> getCoursesByLecturer(@PathVariable Long lecturerId) {
        return courseService.getCoursesByLecturer(lecturerId);
    }
}