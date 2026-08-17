package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.*;
import com.lms.lms_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
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

    @GetMapping("/student/{studentId}")
    public Map<String, Object> getStudentDashboard(@PathVariable Long studentId) {
        Map<String, Object> data = new HashMap<>();

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        data.put("enrolledCourses", enrollments.size());

        List<AssignmentSubmission> submissions = submissionRepository.findByStudentId(studentId);
        long pending = submissions.stream()
                .filter(s -> s.getStatus() == AssignmentSubmission.SubmissionStatus.SUBMITTED ||
                        s.getStatus() == AssignmentSubmission.SubmissionStatus.LATE)
                .count();
        data.put("pendingAssignments", pending);

        List<Attendance> attendanceList = attendanceRepository.findByStudentId(studentId);
        long total = attendanceList.size();
        long present = attendanceList.stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                .count();
        double attendancePct = total > 0 ? (present * 100.0 / total) : 0.0;
        data.put("attendancePercentage", Math.round(attendancePct * 100.0) / 100.0);

        double totalMarks = 0;
        int count = 0;
        for (AssignmentSubmission s : submissions) {
            if (s.getMarks() != null) {
                totalMarks += s.getMarks();
                count++;
            }
        }
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);
        for (QuizAttempt q : attempts) {
            if (q.getScore() != null) {
                totalMarks += q.getScore();
                count++;
            }
        }
        double avg = count > 0 ? (totalMarks / count) : 0.0;
        data.put("averageMarks", Math.round(avg * 100.0) / 100.0);

        // Approved / Available Courses
        List<Course> approvedCourses = courseRepository.findByStatus(Course.CourseStatus.APPROVED);
        List<Map<String, Object>> availableCoursesList = new ArrayList<>();
        for (Course c : approvedCourses) {
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("id", c.getId());
            cMap.put("name", c.getName());
            cMap.put("description", c.getDescription());
            cMap.put("durationWeeks", c.getDurationWeeks());
            cMap.put("thumbnailUrl", c.getThumbnailUrl());
            cMap.put("instituteId", c.getInstituteId());
            availableCoursesList.add(cMap);
        }
        data.put("availableCourses", availableCoursesList);

        // Enrolled Courses List
        List<Map<String, Object>> enrolledList = new ArrayList<>();
        for (Enrollment e : enrollments) {
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
        data.put("enrolledCoursesList", enrolledList);

        return data;
    }


    @GetMapping("/lecturer/{lecturerId}")
    public Map<String, Object> getLecturerDashboard(@PathVariable Long lecturerId) {
        Map<String, Object> data = new HashMap<>();

        List<Course> courses = courseRepository.findByLecturerId(lecturerId);
        data.put("totalCourses", courses.size());

        List<Assignment> assignments = assignmentRepository.findByLecturerId(lecturerId);
        data.put("totalAssignments", assignments.size());

        long pendingGrading = 0;
        Set<Long> studentIds = new HashSet<>();
        for (Assignment assignment : assignments) {
            List<AssignmentSubmission> assignmentSubmissions =
                    submissionRepository.findByAssignmentId(assignment.getId());
            pendingGrading += assignmentSubmissions.stream()
                    .filter(s -> s.getStatus() == AssignmentSubmission.SubmissionStatus.SUBMITTED ||
                            s.getStatus() == AssignmentSubmission.SubmissionStatus.LATE)
                    .count();
        }
        for (Course course : courses) {
            enrollmentRepository.findByCourseId(course.getId())
                    .forEach(enrollment -> studentIds.add(enrollment.getStudentId()));
        }
        data.put("pendingGrading", pendingGrading);
        data.put("totalStudents", studentIds.size());

        return data;
    }

    @GetMapping("/institute/{instituteId}")
    public Map<String, Object> getInstituteDashboard(@PathVariable Long instituteId) {
        Map<String, Object> data = new HashMap<>();

        List<User> students = userRepository.findByInstituteIdAndRole(instituteId, Role.ROLE_STUDENT);
        List<User> lecturers = userRepository.findByInstituteIdAndRole(instituteId, Role.ROLE_LECTURER);
        List<Course> courses = courseRepository.findByInstituteId(instituteId);
        List<Course> pending = courseRepository.findByInstituteIdAndStatus(instituteId, Course.CourseStatus.PENDING_APPROVAL);

        data.put("totalStudents", students.size());
        data.put("totalLecturers", lecturers.size());
        data.put("totalCourses", courses.size());
        data.put("pendingApprovals", pending.size());

        return data;
    }

    @GetMapping("/system-admin")
    public Map<String, Object> getSystemAdminDashboard() {
        Map<String, Object> data = new HashMap<>();

        List<Institute> institutes = instituteRepository.findAll();
        long totalUsers = userRepository.count();
        long activeInst = institutes.stream()
                .filter(i -> i.getStatus() == Institute.InstituteStatus.ACTIVE)
                .count();

        data.put("totalInstitutes", institutes.size());
        data.put("activeInstitutes", activeInst);
        data.put("totalUsers", totalUsers);
        data.put("revenue", 2500000.0);
        data.put("pendingRequests", institutes.stream()
                .filter(i -> i.getStatus() == Institute.InstituteStatus.PENDING)
                .count());

        return data;
    }

    @GetMapping("/parent/{parentId}")
    public Map<String, Object> getParentDashboard(@PathVariable Long parentId) {
        Map<String, Object> data = new HashMap<>();
        List<Map<String, Object>> childrenData = new ArrayList<>();

        List<ParentStudent> links = parentStudentRepository.findByParentId(parentId);
        for (ParentStudent link : links) {
            Long studentId = link.getStudentId();
            User student = userRepository.findById(studentId).orElse(null);
            if (student == null) continue;

            Map<String, Object> child = new HashMap<>();
            child.put("id", studentId);
            child.put("name", student.getFirstName() + " " + student.getLastName());
            child.put("email", student.getEmail());

            List<Attendance> attList = attendanceRepository.findByStudentId(studentId);
            long total = attList.size();
            long present = attList.stream()
                    .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                    .count();
            double attPct = total > 0 ? (present * 100.0 / total) : 0.0;
            child.put("attendance", Math.round(attPct * 100.0) / 100.0);

            List<AssignmentSubmission> subs = submissionRepository.findByStudentId(studentId);
            double totalM = 0;
            int c = 0;
            for (AssignmentSubmission s : subs) {
                if (s.getMarks() != null) {
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
