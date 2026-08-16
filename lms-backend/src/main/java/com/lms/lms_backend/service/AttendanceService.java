package com.lms.lms_backend.service;

import com.lms.lms_backend.model.Attendance;
import com.lms.lms_backend.model.Course;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.AttendanceRepository;
import com.lms.lms_backend.repository.CourseRepository;
import com.lms.lms_backend.repository.UserRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    // Lecturer Attendance Mark කරනවා (එක දවසකට ගොඩක් Students)
    @Transactional
    public List<Attendance> markAttendance(Long courseId, LocalDate date, Map<Long, Attendance.AttendanceStatus> studentStatuses, Long lecturerId) {
        // 1. Course එක තියෙනවද බලන්න
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        // 2. Institute Isolation check
        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied!");
        }

        // 3. Lecturer check (මේ lecturer ට මේ course එකට attendance mark කරන්න පුළුවන්ද?)
        User lecturer = userRepository.findById(lecturerId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found!"));
        if (lecturer.getRole() != com.lms.lms_backend.model.Role.ROLE_LECTURER) {
            throw new RuntimeException("User is not a Lecturer!");
        }

        List<Attendance> savedRecords = new ArrayList<>();

        // 4. එක එක Student ට Attendance Save කරනවා
        for (Map.Entry<Long, Attendance.AttendanceStatus> entry : studentStatuses.entrySet()) {
            Long studentId = entry.getKey();
            Attendance.AttendanceStatus status = entry.getValue();

            // Student තියෙනවද check කරන්න
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));
            if (student.getRole() != com.lms.lms_backend.model.Role.ROLE_STUDENT) {
                throw new RuntimeException("User " + studentId + " is not a Student!");
            }

            // දැනටමත් මේ දවසේ Attendance Mark කරලාද?
            Optional<Attendance> existing = attendanceRepository.findByStudentIdAndCourseIdAndDate(studentId, courseId, date);
            if (existing.isPresent()) {
                // Update existing
                Attendance att = existing.get();
                att.setStatus(status);
                att.setMarkedBy(lecturerId);
                savedRecords.add(attendanceRepository.save(att));
            } else {
                // Create new
                Attendance attendance = new Attendance();
                attendance.setStudentId(studentId);
                attendance.setCourseId(courseId);
                attendance.setDate(date);
                attendance.setStatus(status);
                attendance.setMarkedBy(lecturerId);
                savedRecords.add(attendanceRepository.save(attendance));
            }
        }

        return savedRecords;
    }

    // Student ගේ Course එකක Attendance Summary එක
    public Map<String, Object> getAttendanceSummary(Long studentId, Long courseId) {
        // Student check
        userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        Long totalClasses = attendanceRepository.countTotalClasses(studentId, courseId);
        Long presentCount = attendanceRepository.countByStatus(studentId, courseId, Attendance.AttendanceStatus.PRESENT);
        Long absentCount = attendanceRepository.countByStatus(studentId, courseId, Attendance.AttendanceStatus.ABSENT);
        Long lateCount = attendanceRepository.countByStatus(studentId, courseId, Attendance.AttendanceStatus.LATE);
        Long excusedCount = attendanceRepository.countByStatus(studentId, courseId, Attendance.AttendanceStatus.EXCUSED);

        double percentage = 0.0;
        if (totalClasses > 0) {
            percentage = (presentCount.doubleValue() / totalClasses.doubleValue()) * 100;
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("studentId", studentId);
        summary.put("courseId", courseId);
        summary.put("totalClasses", totalClasses);
        summary.put("present", presentCount);
        summary.put("absent", absentCount);
        summary.put("late", lateCount);
        summary.put("excused", excusedCount);
        summary.put("attendancePercentage", Math.round(percentage * 100.0) / 100.0);

        return summary;
    }

    // Student ගේ හැම Course එකකම Attendance Summary
    public List<Map<String, Object>> getStudentAllAttendance(Long studentId) {
        List<Attendance> records = attendanceRepository.findByStudentId(studentId);
        Set<Long> courseIds = new HashSet<>();
        for (Attendance a : records) {
            courseIds.add(a.getCourseId());
        }

        List<Map<String, Object>> summaries = new ArrayList<>();
        for (Long courseId : courseIds) {
            summaries.add(getAttendanceSummary(studentId, courseId));
        }
        return summaries;
    }

    // Course එකක Students ගේ Attendance List එක (Lecturerට)
    public List<Attendance> getAttendanceByCourseAndDate(Long courseId, LocalDate date) {
        return attendanceRepository.findByCourseId(courseId)
                .stream()
                .filter(a -> a.getDate().equals(date))
                .toList();
    }
}