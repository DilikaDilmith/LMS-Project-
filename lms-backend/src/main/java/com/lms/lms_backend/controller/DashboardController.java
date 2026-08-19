package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.*;
import com.lms.lms_backend.repository.*;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime; // 👈 NEW Import (Reports සඳහා)
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CourseRepository courseRepository;
    @Autowired
    private EnrollmentRepository enrollmentRepository;
    @Autowired
    private AssignmentRepository assignmentRepository;
    @Autowired
    private AssignmentSubmissionRepository submissionRepository;
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private QuizAttemptRepository quizAttemptRepository;
    @Autowired
    private InstituteRepository instituteRepository;
    @Autowired
    private ParentStudentRepository parentStudentRepository;

    // ================================================
    // STUDENT DASHBOARD
    // ================================================
    @GetMapping({"/student", "/student/{studentId}"})
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getStudentDashboard(@PathVariable(required = false) Long studentId) {
        if (studentId == null || studentId == 0) {
            studentId = 1L;
        }

        Map<String, Object> data = new HashMap<>();

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        if (enrollments == null) enrollments = Collections.emptyList();
        data.put("enrolledCourses", enrollments.size());

        List<AssignmentSubmission> submissions = submissionRepository.findByStudentId(studentId);
        if (submissions == null) submissions = Collections.emptyList();

        long pending = submissions.stream()
                .filter(s -> s != null && s.getStatus() != null &&
                        (s.getStatus() == AssignmentSubmission.SubmissionStatus.SUBMITTED ||
                         s.getStatus() == AssignmentSubmission.SubmissionStatus.LATE))
                .count();
        data.put("pendingAssignments", pending);

        List<Attendance> attendanceList = attendanceRepository.findByStudentId(studentId);
        if (attendanceList == null) attendanceList = Collections.emptyList();

        long total = attendanceList.size();
        long present = attendanceList.stream()
                .filter(a -> a != null && a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                .count();
        double attendancePct = total > 0 ? (present * 100.0 / total) : 0.0;
        data.put("attendancePercentage", Math.round(attendancePct * 100.0) / 100.0);

        double totalMarks = 0;
        int count = 0;
        for (AssignmentSubmission s : submissions) {
            if (s != null && s.getMarks() != null) {
                totalMarks += s.getMarks();
                count++;
            }
        }
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);
        if (attempts != null) {
            for (QuizAttempt q : attempts) {
                if (q != null && q.getScore() != null) {
                    totalMarks += q.getScore();
                    count++;
                }
            }
        }
        double avg = count > 0 ? (totalMarks / count) : 0.0;
        data.put("averageMarks", Math.round(avg * 100.0) / 100.0);

        // Approved / Available Courses
        List<Course> approvedCourses = courseRepository.findByStatus(Course.CourseStatus.APPROVED);
        if (approvedCourses == null) approvedCourses = Collections.emptyList();

        List<Map<String, Object>> availableCoursesList = new ArrayList<>();
        for (Course c : approvedCourses) {
            if (c != null) {
                Map<String, Object> cMap = new HashMap<>();
                cMap.put("id", c.getId());
                cMap.put("name", c.getName());
                cMap.put("description", c.getDescription());
                cMap.put("durationWeeks", c.getDurationWeeks());
                cMap.put("thumbnailUrl", c.getThumbnailUrl());
                cMap.put("instituteId", c.getInstituteId());
                availableCoursesList.add(cMap);
            }
        }
        data.put("availableCourses", availableCoursesList);

        // Enrolled Courses List
        List<Map<String, Object>> enrolledList = new ArrayList<>();
        for (Enrollment e : enrollments) {
            if (e != null && e.getCourseId() != null) {
                Course c = courseRepository.findById(e.getCourseId()).orElse(null);
                if (c != null) {
                    Map<String, Object> cMap = new HashMap<>();
                    cMap.put("id", c.getId());
                    cMap.put("name", c.getName());
                    cMap.put("description", c.getDescription());
                    cMap.put("durationWeeks", c.getDurationWeeks());
                    cMap.put("thumbnailUrl", c.getThumbnailUrl());
                    enrolledList.add(cMap);
                }
            }
        }
        data.put("enrolledCoursesList", enrolledList);

        return data;
    }

    // ================================================
    // LECTURER DASHBOARD
    // ================================================
    @GetMapping({"/lecturer", "/lecturer/{lecturerId}"})
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getLecturerDashboard(@PathVariable(required = false) Long lecturerId) {
        if (lecturerId == null || lecturerId == 0) {
            lecturerId = 1L;
        }

        Map<String, Object> data = new HashMap<>();

        List<Course> courses = courseRepository.findByLecturerId(lecturerId);
        if (courses == null) courses = Collections.emptyList();
        data.put("totalCourses", courses.size());

        List<Assignment> assignments = assignmentRepository.findByLecturerId(lecturerId);
        if (assignments == null) assignments = Collections.emptyList();
        data.put("totalAssignments", assignments.size());

        long pendingGrading = 0;
        Set<Long> studentIds = new HashSet<>();
        for (Assignment assignment : assignments) {
            if (assignment != null && assignment.getId() != null) {
                List<AssignmentSubmission> assignmentSubmissions =
                        submissionRepository.findByAssignmentId(assignment.getId());
                if (assignmentSubmissions != null) {
                    pendingGrading += assignmentSubmissions.stream()
                            .filter(s -> s != null && s.getStatus() != null &&
                                    (s.getStatus() == AssignmentSubmission.SubmissionStatus.SUBMITTED ||
                                     s.getStatus() == AssignmentSubmission.SubmissionStatus.LATE))
                            .count();
                }
            }
        }
        for (Course course : courses) {
            if (course != null && course.getId() != null) {
                List<Enrollment> courseEnrollments = enrollmentRepository.findByCourseId(course.getId());
                if (courseEnrollments != null) {
                    courseEnrollments.forEach(enrollment -> {
                        if (enrollment != null && enrollment.getStudentId() != null) {
                            studentIds.add(enrollment.getStudentId());
                        }
                    });
                }
            }
        }
        data.put("pendingGrading", pendingGrading);
        data.put("totalStudents", studentIds.size());

        return data;
    }

    // ================================================
    // INSTITUTE ADMIN DASHBOARD
    // ================================================
    @GetMapping({"/institute", "/institute/{instituteId}"})
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getInstituteDashboard(@PathVariable(required = false) Long instituteId) {
        Long resolvedId = instituteId;
        if (resolvedId == null || resolvedId == 0) {
            resolvedId = TenantContext.getInstituteId();
        }
        if (resolvedId == null || resolvedId == 0) {
            resolvedId = 1L;
        }
        final Long targetInstituteId = resolvedId;

        Map<String, Object> data = new HashMap<>();

        List<User> students = userRepository.findByInstituteIdAndRole(targetInstituteId, Role.ROLE_STUDENT);
        List<User> lecturers = userRepository.findByInstituteIdAndRole(targetInstituteId, Role.ROLE_LECTURER);
        List<Course> courses = courseRepository.findByInstituteId(targetInstituteId);
        List<Course> pendingCourses = courseRepository.findByInstituteIdAndStatus(targetInstituteId, Course.CourseStatus.PENDING_APPROVAL);
        List<Course> draftCourses = courseRepository.findByInstituteIdAndStatus(targetInstituteId, Course.CourseStatus.DRAFT);

        long pendingUsersCount = userRepository.findAll().stream()
                .filter(u -> u != null && "PENDING".equalsIgnoreCase(u.getStatus()) &&
                        (targetInstituteId.equals(u.getInstituteId()) || u.getInstituteId() == null))
                .count();

        int totalPending = (pendingCourses != null ? pendingCourses.size() : 0) + 
                           (draftCourses != null ? draftCourses.size() : 0) + 
                           (int) pendingUsersCount;

        data.put("totalStudents", students != null ? students.size() : 0);
        data.put("totalLecturers", lecturers != null ? lecturers.size() : 0);
        data.put("totalCourses", courses != null ? courses.size() : 0);
        data.put("pendingUsers", pendingUsersCount);
        data.put("pendingApprovals", totalPending);

        return data;
    }

    // ================================================
    // SYSTEM ADMIN DASHBOARD (Overview)
    // ================================================
    @GetMapping("/system-admin")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getSystemAdminDashboard() {
        Map<String, Object> data = new HashMap<>();

        List<Institute> institutes = instituteRepository.findAll();
        if (institutes == null) institutes = Collections.emptyList();

        long totalUsers = userRepository.count();
        long activeInst = institutes.stream()
                .filter(i -> i != null && i.getStatus() == Institute.InstituteStatus.ACTIVE)
                .count();

        data.put("totalInstitutes", institutes.size());
        data.put("activeInstitutes", activeInst);
        data.put("totalUsers", totalUsers);
        data.put("revenue", 2500000.0);
        data.put("pendingRequests", institutes.stream()
                .filter(i -> i != null && i.getStatus() == Institute.InstituteStatus.PENDING)
                .count());

        return data;
    }

    // ================================================
    // PARENT DASHBOARD
    // ================================================
    @GetMapping({"/parent", "/parent/{parentId}"})
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getParentDashboard(@PathVariable(required = false) Long parentId) {
        if (parentId == null || parentId == 0) {
            parentId = 1L;
        }

        Map<String, Object> data = new HashMap<>();
        List<Map<String, Object>> childrenData = new ArrayList<>();

        List<ParentStudent> links = parentStudentRepository.findByParentId(parentId);
        if (links == null) links = Collections.emptyList();

        for (ParentStudent link : links) {
            if (link == null || link.getStudentId() == null) continue;

            Long studentId = link.getStudentId();
            User student = userRepository.findById(studentId).orElse(null);
            if (student == null) continue;

            Map<String, Object> child = new HashMap<>();
            child.put("id", studentId);
            child.put("name", (student.getFirstName() != null ? student.getFirstName() : "") + " " +
                             (student.getLastName() != null ? student.getLastName() : ""));
            child.put("email", student.getEmail());

            List<Attendance> attList = attendanceRepository.findByStudentId(studentId);
            if (attList == null) attList = Collections.emptyList();

            long total = attList.size();
            long present = attList.stream()
                    .filter(a -> a != null && a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                    .count();
            double attPct = total > 0 ? (present * 100.0 / total) : 0.0;
            child.put("attendance", Math.round(attPct * 100.0) / 100.0);

            List<AssignmentSubmission> subs = submissionRepository.findByStudentId(studentId);
            if (subs == null) subs = Collections.emptyList();

            double totalM = 0;
            int c = 0;
            for (AssignmentSubmission s : subs) {
                if (s != null && s.getMarks() != null) {
                    totalM += s.getMarks();
                    c++;
                }
            }
            child.put("avgMarks", c > 0 ? Math.round((totalM / c) * 100.0) / 100.0 : 0.0);
            child.put("progress", 0.0);
            child.put("fees", "LKR 0");

            childrenData.add(child);
        }
        data.put("children", childrenData);
        return data;
    }

    // ================================================
    // 👇 NEW: SYSTEM ADMIN FULL REPORTS
    // ================================================
    @GetMapping("/system-admin/reports")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public Map<String, Object> getSystemReports() {
        Map<String, Object> reports = new HashMap<>();

        // 1. Institute Stats
        List<Institute> allInstitutes = instituteRepository.findAll();
        long totalInstitutes = allInstitutes.size();
        long activeInstitutes = allInstitutes.stream()
                .filter(i -> i.getStatus() == Institute.InstituteStatus.ACTIVE).count();
        long pendingInstitutes = allInstitutes.stream()
                .filter(i -> i.getStatus() == Institute.InstituteStatus.PENDING).count();
        long suspendedInstitutes = allInstitutes.stream()
                .filter(i -> i.getStatus() == Institute.InstituteStatus.SUSPENDED).count();

        Map<String, Object> instituteStats = new HashMap<>();
        instituteStats.put("total", totalInstitutes);
        instituteStats.put("active", activeInstitutes);
        instituteStats.put("pending", pendingInstitutes);
        instituteStats.put("suspended", suspendedInstitutes);
        reports.put("instituteStats", instituteStats);

        // 2. User Stats (by Role)
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        long students = allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_STUDENT).count();
        long lecturers = allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_LECTURER).count();
        long parents = allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_PARENT).count();
        long admins = allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_INSTITUTE_ADMIN || u.getRole() == Role.ROLE_SYSTEM_ADMIN).count();

        Map<String, Object> userStats = new HashMap<>();
        userStats.put("total", totalUsers);
        userStats.put("students", students);
        userStats.put("lecturers", lecturers);
        userStats.put("parents", parents);
        userStats.put("admins", admins);
        reports.put("userStats", userStats);

        // 3. Course Stats (by Status)
        List<Course> allCourses = courseRepository.findAll();
        long totalCourses = allCourses.size();
        long approvedCourses = allCourses.stream()
                .filter(c -> c.getStatus() == Course.CourseStatus.APPROVED).count();
        long pendingCourses = allCourses.stream()
                .filter(c -> c.getStatus() == Course.CourseStatus.PENDING_APPROVAL).count();
        long rejectedCourses = allCourses.stream()
                .filter(c -> c.getStatus() == Course.CourseStatus.REJECTED).count();
        long draftCourses = allCourses.stream()
                .filter(c -> c.getStatus() == Course.CourseStatus.DRAFT).count();

        Map<String, Object> courseStats = new HashMap<>();
        courseStats.put("total", totalCourses);
        courseStats.put("approved", approvedCourses);
        courseStats.put("pending", pendingCourses);
        courseStats.put("rejected", rejectedCourses);
        courseStats.put("draft", draftCourses);
        reports.put("courseStats", courseStats);

        // 4. Revenue Stats (Mock - Payments Table එකෙන් ගණනය කිරීමට හැක)
        double totalRevenue = 2500000.0;
        double basicRevenue = 500000.0;
        double standardRevenue = 1000000.0;
        double premiumRevenue = 1000000.0;

        Map<String, Object> revenueStats = new HashMap<>();
        revenueStats.put("total", totalRevenue);
        revenueStats.put("basic", basicRevenue);
        revenueStats.put("standard", standardRevenue);
        revenueStats.put("premium", premiumRevenue);
        reports.put("revenueStats", revenueStats);

        // 5. Top Courses (Mock - වැඩිම Students සිටින Courses)
        List<Map<String, Object>> topCourses = new ArrayList<>();
        // ඔබට මෙය Real Query එකක් ලෙස වෙනස් කළ හැක
        Map<String, Object> c1 = new HashMap<>();
        c1.put("name", "Web Development");
        c1.put("students", 30);
        topCourses.add(c1);
        Map<String, Object> c2 = new HashMap<>();
        c2.put("name", "Java Programming");
        c2.put("students", 25);
        topCourses.add(c2);
        Map<String, Object> c3 = new HashMap<>();
        c3.put("name", "Database Systems");
        c3.put("students", 20);
        topCourses.add(c3);
        reports.put("topCourses", topCourses);

        // 6. Recent Registrations (Last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentRegistrations = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();
        reports.put("recentRegistrations", recentRegistrations);

        return reports;
    }
}