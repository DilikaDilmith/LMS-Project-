package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.AssignmentRequest;
import com.lms.lms_backend.dto.AssignmentResponse;
import com.lms.lms_backend.dto.GradeRequest;
import com.lms.lms_backend.dto.SubmissionRequest;
import com.lms.lms_backend.dto.SubmissionResponse;
import com.lms.lms_backend.model.Assignment;
import com.lms.lms_backend.model.AssignmentSubmission;
import com.lms.lms_backend.model.Course;
import com.lms.lms_backend.model.Notification;
import com.lms.lms_backend.model.Role;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.AssignmentRepository;
import com.lms.lms_backend.repository.AssignmentSubmissionRepository;
import com.lms.lms_backend.repository.CourseRepository;
import com.lms.lms_backend.repository.UserRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private AssignmentSubmissionRepository submissionRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    // 👇 Notification Service Inject කරන්න
    @Autowired
    private NotificationService notificationService;

    public AssignmentResponse createAssignment(AssignmentRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied!");
        }

        Long targetLecturerId = request.getLecturerId();
        if (targetLecturerId == null) {
            targetLecturerId = course.getLecturerId();
        }
        if (targetLecturerId == null) {
            targetLecturerId = 1L; // Fallback default
        }

        Assignment assignment = new Assignment();
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setCourseId(request.getCourseId());
        assignment.setLecturerId(targetLecturerId);

        assignment.setDueDate(request.getDueDate());
        assignment.setMaxMarks(request.getMaxMarks());
        assignment.setAttachmentUrl(request.getAttachmentUrl());

        Assignment saved = assignmentRepository.save(assignment);
        return mapToResponse(saved);
    }

    public List<AssignmentResponse> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourseId(courseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SubmissionResponse submitAssignment(Long assignmentId, Long studentId, SubmissionRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        if (submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId).isPresent()) {
            throw new RuntimeException("You have already submitted this assignment!");
        }

        AssignmentSubmission.SubmissionStatus status = AssignmentSubmission.SubmissionStatus.SUBMITTED;
        if (LocalDateTime.now().isAfter(assignment.getDueDate())) {
            status = AssignmentSubmission.SubmissionStatus.LATE;
        }

        AssignmentSubmission submission = new AssignmentSubmission();
        submission.setAssignmentId(assignmentId);
        submission.setStudentId(studentId);
        submission.setFileUrl(request.getFileUrl());
        submission.setStatus(status);

        AssignmentSubmission saved = submissionRepository.save(submission);
        return mapToSubmissionResponse(saved);
    }

    public SubmissionResponse gradeSubmission(Long submissionId, GradeRequest request, Long lecturerId) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found!"));

        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        if (!assignment.getLecturerId().equals(lecturerId)) {
            Course course = courseRepository.findById(assignment.getCourseId()).orElse(null);
            boolean isCourseLecturer = course != null && lecturerId.equals(course.getLecturerId());
            User user = userRepository.findById(lecturerId).orElse(null);
            boolean isAdmin = user != null && (user.getRole() == Role.ROLE_INSTITUTE_ADMIN || user.getRole() == Role.ROLE_SYSTEM_ADMIN);
            if (!isCourseLecturer && !isAdmin) {
                throw new RuntimeException("You are not authorized to grade this submission!");
            }
        }

        if (request.getMarks() > assignment.getMaxMarks()) {
            throw new RuntimeException("Marks cannot exceed max marks (" + assignment.getMaxMarks() + ")");
        }

        submission.setMarks(request.getMarks());
        submission.setFeedback(request.getFeedback());
        submission.setStatus(AssignmentSubmission.SubmissionStatus.GRADED);
        submission.setGradedBy(lecturerId);
        submission.setGradedAt(LocalDateTime.now());

        AssignmentSubmission saved = submissionRepository.save(submission);

        // 👇 **NEW: Notification එක Send කරනවා (Student ට)**
        try {
            String title = "Assignment Graded: " + assignment.getTitle();
            String message = "Your assignment '" + assignment.getTitle() + "' has been graded.\n" +
                             "Marks: " + request.getMarks() + "/" + assignment.getMaxMarks() + "\n" +
                             "Feedback: " + (request.getFeedback() != null ? request.getFeedback() : "No feedback provided.");
            notificationService.createNotification(
                    submission.getStudentId(),
                    title,
                    message,
                    Notification.NotificationType.SUCCESS,
                    "/assignments/" + assignment.getId()
            );
        } catch (Exception e) {
            // Notification එක fail උනාට main operation එක stop වෙන්න එපා
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return mapToSubmissionResponse(saved);
    }

    public List<SubmissionResponse> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId)
                .stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    public List<SubmissionResponse> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId)
                .stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    private AssignmentResponse mapToResponse(Assignment assignment) {
        return new AssignmentResponse(
                assignment.getId(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getCourseId(),
                assignment.getLecturerId(),
                assignment.getDueDate(),
                assignment.getMaxMarks(),
                assignment.getAttachmentUrl(),
                assignment.getCreatedAt()
        );
    }

    private SubmissionResponse mapToSubmissionResponse(AssignmentSubmission submission) {
        return new SubmissionResponse(
                submission.getId(),
                submission.getAssignmentId(),
                submission.getStudentId(),
                submission.getFileUrl(),
                submission.getStatus(),
                submission.getMarks(),
                submission.getFeedback(),
                submission.getSubmittedAt()
        );
    }
}