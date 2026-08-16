package com.lms.lms_backend.service;

import com.lms.lms_backend.model.Attendance;
import com.lms.lms_backend.model.Enrollment;
import com.lms.lms_backend.model.Lesson;
import com.lms.lms_backend.model.Module;
import com.lms.lms_backend.model.ParentStudent;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ParentDashboardService {

    @Autowired
    private ParentStudentRepository parentStudentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AssignmentSubmissionRepository assignmentSubmissionRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private StudentLessonProgressRepository lessonProgressRepository;

    @Autowired
    private ModuleRepository moduleRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private FeeRepository feeRepository;

    // Child Dashboard Data එකක් හදන Helper Class එක (Inner DTO)
    public static class ChildDashboardData {
        public Long studentId;
        public String studentName;
        public String email;
        public Double attendancePercentage;
        public Double averageMarks;
        public Double overallProgress;
        public List<CourseProgress> courses;
        public List<FeeSummary> fees;
        public String status; // Active, Inactive etc.
    }

    public static class CourseProgress {
        public String courseName;
        public Double progress;
        public Integer completedLessons;
        public Integer totalLessons;
    }

    public static class FeeSummary {
        public String courseName;
        public Double totalAmount;
        public Double paidAmount;
        public String status;
    }

    // Parent කෙනෙකුගේ හැම Child ගේම Dashboard Data එක ගන්න
    public List<ChildDashboardData> getParentDashboard(Long parentId) {
        List<ParentStudent> links = parentStudentRepository.findByParentId(parentId);
        List<ChildDashboardData> dashboards = new ArrayList<>();

        for (ParentStudent link : links) {
            Long studentId = link.getStudentId();
            ChildDashboardData data = new ChildDashboardData();

            // 1. Student Basic Info
            User student = userRepository.findById(studentId).orElse(null);
            if (student == null) continue;
            data.studentId = studentId;
            data.studentName = student.getFirstName() + " " + student.getLastName();
            data.email = student.getEmail();
            data.status = student.getStatus();

            // 2. Attendance (overall)
            List<Attendance> attendanceList = attendanceRepository.findByStudentId(studentId);
            long totalClasses = 0;
            long presentCount = 0;
            for (var att : attendanceList) {
                totalClasses++;
                if (att.getStatus() == Attendance.AttendanceStatus.PRESENT) presentCount++;
            }
            data.attendancePercentage = totalClasses > 0 ? (presentCount * 100.0 / totalClasses) : 0.0;

            // 3. Average Marks (Assignments + Quizzes)
            double totalMarks = 0;
            int count = 0;
            // Assignments
            var submissions = assignmentSubmissionRepository.findByStudentId(studentId);
            for (var sub : submissions) {
                if (sub.getMarks() != null) {
                    totalMarks += sub.getMarks();
                    count++;
                }
            }
            // Quizzes
            var attempts = quizAttemptRepository.findByStudentId(studentId);
            for (var att : attempts) {
                if (att.getScore() != null) {
                    totalMarks += att.getScore();
                    count++;
                }
            }
            data.averageMarks = count > 0 ? (totalMarks / count) : 0.0;

            // 4. Course Progress & Fees
            List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
            List<CourseProgress> courseProgresses = new ArrayList<>();
            List<FeeSummary> feeSummaries = new ArrayList<>();

            for (Enrollment enrollment : enrollments) {
                // Progress
                Long courseId = enrollment.getCourseId();
                var modules = moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
                int totalLessons = 0;
                int completedLessons = 0;

                for (Module module : modules) {
                    List<Lesson> lessons = lessonRepository.findByModuleIdOrderByOrderIndexAsc(module.getId());
                    for (Lesson lesson : lessons) {
                        totalLessons++;
                        boolean isComplete = lessonProgressRepository.existsByStudentIdAndLessonId(studentId, lesson.getId());
                        if (isComplete) completedLessons++;
                    }
                }

                CourseProgress cp = new CourseProgress();
                cp.courseName = "Course ID: " + courseId; // Name එක නැතුව මේක දාමු (හරි එකට Course Name එක join කරන්න පුළුවන්)
                cp.totalLessons = totalLessons;
                cp.completedLessons = completedLessons;
                cp.progress = totalLessons > 0 ? (completedLessons * 100.0 / totalLessons) : 0.0;
                courseProgresses.add(cp);

                // Fees
                var fee = feeRepository.findByStudentIdAndCourseId(studentId, courseId);
                if (fee.isPresent()) {
                    FeeSummary fs = new FeeSummary();
                    fs.courseName = "Course ID: " + courseId;
                    fs.totalAmount = fee.get().getTotalAmount();
                    fs.paidAmount = fee.get().getPaidAmount();
                    fs.status = fee.get().getStatus().name();
                    feeSummaries.add(fs);
                }
            }

            data.courses = courseProgresses;
            data.fees = feeSummaries;

            // Overall Progress (average of course progresses)
            double totalProgress = 0;
            for (CourseProgress cp : courseProgresses) {
                totalProgress += cp.progress;
            }
            data.overallProgress = courseProgresses.isEmpty() ? 0.0 : (totalProgress / courseProgresses.size());

            dashboards.add(data);
        }

        return dashboards;
    }
}