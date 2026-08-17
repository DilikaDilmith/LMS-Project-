package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.dto.AssignmentRequest;
import com.lms.lms_backend.dto.AssignmentResponse;
import com.lms.lms_backend.dto.GradeRequest;
import com.lms.lms_backend.dto.SubmissionRequest;
import com.lms.lms_backend.dto.SubmissionResponse;
import com.lms.lms_backend.service.AssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('LECTURER')")
    @Auditable(action = "CREATE_ASSIGNMENT", description = "Lecturer creates an assignment")
    public AssignmentResponse createAssignment(@RequestBody AssignmentRequest request) {
        return assignmentService.createAssignment(request);
    }

    @GetMapping("/course/{courseId}")
    public List<AssignmentResponse> getAssignmentsByCourse(@PathVariable Long courseId) {
        return assignmentService.getAssignmentsByCourse(courseId);
    }

    @PostMapping("/{assignmentId}/submit/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Auditable(action = "SUBMIT_ASSIGNMENT", description = "Student submits assignment")
    public SubmissionResponse submitAssignment(
            @PathVariable Long assignmentId,
            @PathVariable Long studentId,
            @RequestBody SubmissionRequest request) {
        return assignmentService.submitAssignment(assignmentId, studentId, request);
    }

    @PostMapping("/submissions/{submissionId}/grade/lecturer/{lecturerId}")
    @PreAuthorize("hasRole('LECTURER')")
    @Auditable(action = "GRADE_ASSIGNMENT", description = "Lecturer grades assignment submission")
    public SubmissionResponse gradeSubmission(
            @PathVariable Long submissionId,
            @PathVariable Long lecturerId,
            @RequestBody GradeRequest request) {
        return assignmentService.gradeSubmission(submissionId, request, lecturerId);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('INSTITUTE_ADMIN')")
    public List<SubmissionResponse> getSubmissionsByStudent(@PathVariable Long studentId) {
        return assignmentService.getSubmissionsByStudent(studentId);
    }

    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN')")
    public List<SubmissionResponse> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        return assignmentService.getSubmissionsByAssignment(assignmentId);
    }
}