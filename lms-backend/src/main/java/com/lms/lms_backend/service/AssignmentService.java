package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.AssignmentRequest;
import com.lms.lms_backend.dto.AssignmentResponse;
import com.lms.lms_backend.dto.GradeRequest;
import com.lms.lms_backend.dto.SubmissionRequest;
import com.lms.lms_backend.dto.SubmissionResponse;
import com.lms.lms_backend.model.Assignment;
import com.lms.lms_backend.model.AssignmentSubmission;
import com.lms.lms_backend.model.Course;
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

    // Lecturer Assignment එකක් Create කරනවා
    public AssignmentResponse createAssignment(AssignmentRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        // Institute Isolation Check
        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied!");
        }

        // Lecturer check
        User lecturer = userRepository.findById(request.getLecturerId())
                .orElseThrow(() -> new RuntimeException("Lecturer not found!"));

        Assignment assignment = new Assignment();
        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        assignment.setCourseId(request.getCourseId());
        assignment.setLecturerId(request.getLecturerId());
        assignment.setDueDate(request.getDueDate());
        assignment.setMaxMarks(request.getMaxMarks());
        assignment.setAttachmentUrl(request.getAttachmentUrl());

        Assignment saved = assignmentRepository.save(assignment);
        return mapToResponse(saved);
    }

    // Course එකේ Assignments List එක
    public List<AssignmentResponse> getAssignmentsByCourse(Long courseId) {
        return assignmentRepository.findByCourseId(courseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Student Assignment Submit කරනවා
    public SubmissionResponse submitAssignment(Long assignmentId, Long studentId, SubmissionRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        // දැනටමත් Submit කරලාද?
        if (submissionRepository.findByAssignmentIdAndStudentId(assignmentId, studentId).isPresent()) {
            throw new RuntimeException("You have already submitted this assignment!");
        }

        // Due Date check - LATE status එක set කරනවා
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

    // Lecturer Submission Grade කරනවා
    public SubmissionResponse gradeSubmission(Long submissionId, GradeRequest request, Long lecturerId) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found!"));

        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found!"));

        // Lecturer validate කරනවා (මේ Lecturerට මේ assignment එක අයිතිද?)
        if (!assignment.getLecturerId().equals(lecturerId)) {
            throw new RuntimeException("You are not authorized to grade this submission!");
        }

        // Marks validate
        if (request.getMarks() > assignment.getMaxMarks()) {
            throw new RuntimeException("Marks cannot exceed max marks (" + assignment.getMaxMarks() + ")");
        }

        submission.setMarks(request.getMarks());
        submission.setFeedback(request.getFeedback());
        submission.setStatus(AssignmentSubmission.SubmissionStatus.GRADED);
        submission.setGradedBy(lecturerId);
        submission.setGradedAt(LocalDateTime.now());

        AssignmentSubmission saved = submissionRepository.save(submission);
        return mapToSubmissionResponse(saved);
    }

    // Student ගේ Submissions List එක
    public List<SubmissionResponse> getSubmissionsByStudent(Long studentId) {
        return submissionRepository.findByStudentId(studentId)
                .stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    // Assignment එකක Submissions List (Lecturer/Admin)
    public List<SubmissionResponse> getSubmissionsByAssignment(Long assignmentId) {
        return submissionRepository.findByAssignmentId(assignmentId)
                .stream()
                .map(this::mapToSubmissionResponse)
                .collect(Collectors.toList());
    }

    // Helper Methods
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