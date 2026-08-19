package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.Attendance;
import com.lms.lms_backend.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    // Lecturer Attendance Mark කරනවා
    @PostMapping("/mark")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<Attendance> markAttendance(
            @RequestParam Long courseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody Map<Long, Attendance.AttendanceStatus> studentStatuses,
            @RequestParam(required = false) Long lecturerId) {
        Long effectiveLecturerId = lecturerId != null ? lecturerId : 1L;
        return attendanceService.markAttendance(courseId, date, studentStatuses, effectiveLecturerId);
    }

    // Student ගේ Course එකක Attendance Summary
    @GetMapping("/summary/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('PARENT') or hasRole('INSTITUTE_ADMIN')")
    public Map<String, Object> getAttendanceSummary(@PathVariable Long studentId, @PathVariable Long courseId) {
        return attendanceService.getAttendanceSummary(studentId, courseId);
    }

    // Student ගේ හැම Course එකකම Attendance Summary
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('PARENT') or hasRole('INSTITUTE_ADMIN')")
    public List<Map<String, Object>> getStudentAllAttendance(@PathVariable Long studentId) {
        return attendanceService.getStudentAllAttendance(studentId);
    }

    // Course එකක Date එකක Attendance List එක (Lecturerට)
    @GetMapping("/course/{courseId}/date/{date}")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN')")
    public List<Attendance> getAttendanceByCourseAndDate(
            @PathVariable Long courseId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return attendanceService.getAttendanceByCourseAndDate(courseId, date);
    }
}