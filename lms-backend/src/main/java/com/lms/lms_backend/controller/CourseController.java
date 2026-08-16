package com.lms.lms_backend.controller;

import com.lms.lms_backend.dto.CourseRequest;
import com.lms.lms_backend.dto.CourseResponse;
import com.lms.lms_backend.service.CourseService;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    // 👇 Lecturerට විතරක් Course Create කරන්න පුළුවන්
    @PostMapping
    @PreAuthorize("hasRole('LECTURER')")
    public CourseResponse createCourse(@RequestBody CourseRequest request) {
        return courseService.createCourse(request);
    }

    // 👇 Lecturerට Course Submit for Approval කරන්න පුළුවන්
    @PostMapping("/{courseId}/submit")
    @PreAuthorize("hasRole('LECTURER')")
    public CourseResponse submitForApproval(@PathVariable Long courseId) {
        return courseService.submitForApproval(courseId);
    }

    // 👇 Institute Adminට විතරක් Course Approve කරන්න පුළුවන්
    @PostMapping("/{courseId}/approve")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN')")
    public CourseResponse approveCourse(@PathVariable Long courseId) {
        return courseService.approveCourse(courseId);
    }

    // 👇 Institute Adminට විතරක් Course Reject කරන්න පුළුවන්
    @PostMapping("/{courseId}/reject")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN')")
    public CourseResponse rejectCourse(@PathVariable Long courseId, @RequestParam String reason) {
        return courseService.rejectCourse(courseId, reason);
    }

    // 👇 Current Institute එකේ හැම Course එකම ගන්න (Institute Admin/Student)
    @GetMapping
    public List<CourseResponse> getCoursesForCurrentInstitute() {
        Long instituteId = TenantContext.getInstituteId();
        if (instituteId == null) {
            throw new RuntimeException("Institute context not found!");
        }
        return courseService.getCoursesByInstitute(instituteId);
    }

    // 👇 Current Institute එකේ Approved Courses විතරක් ගන්න (Studentsට)
    @GetMapping("/approved")
    public List<CourseResponse> getApprovedCourses() {
        Long instituteId = TenantContext.getInstituteId();
        if (instituteId == null) {
            throw new RuntimeException("Institute context not found!");
        }
        return courseService.getApprovedCoursesByInstitute(instituteId);
    }

    // 👇 Lecturer කෙනෙක් හදපු Courses ගන්න
    @GetMapping("/lecturer/{lecturerId}")
    @PreAuthorize("hasRole('LECTURER')")
    public List<CourseResponse> getCoursesByLecturer(@PathVariable Long lecturerId) {
        return courseService.getCoursesByLecturer(lecturerId);
    }
}