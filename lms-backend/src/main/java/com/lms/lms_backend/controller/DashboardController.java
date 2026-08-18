package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.*;
import com.lms.lms_backend.repository.*;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping({"/institute", "/institute/{instituteId}"})
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getInstituteDashboard(@PathVariable(required = false) Long instituteId) {
        if (instituteId == null || instituteId == 0) {
            instituteId = TenantContext.getInstituteId();
        }
        if (instituteId == null || instituteId == 0) {
            instituteId = 1L;
        }

        Map<String, Object> data = new HashMap<>();

        List<User> students = userRepository.findByInstituteIdAndRole(instituteId, Role.ROLE_STUDENT);
        List<User> lecturers = userRepository.findByInstituteIdAndRole(instituteId, Role.ROLE_LECTURER);
        List<Course> courses = courseRepository.findByInstituteId(instituteId);
        List<Course> pending = courseRepository.findByInstituteIdAndStatus(instituteId, Course.CourseStatus.PENDING_APPROVAL);
        List<Course> draft = courseRepository.findByInstituteIdAndStatus(instituteId, Course.CourseStatus.DRAFT);

        int totalPending = (pending != null ? pending.size() : 0) + (draft != null ? draft.size() : 0);

        data.put("totalStudents", students != null ? students.size() : 0);
        data.put("totalLecturers", lecturers != null ? lecturers.size() : 0);
        data.put("totalCourses", courses != null ? courses.size() : 0);
        data.put("pendingApprovals", totalPending);

        return data;
    }

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
}

