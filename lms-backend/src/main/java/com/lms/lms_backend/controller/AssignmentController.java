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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private static final Path UPLOAD_DIRECTORY = Paths.get("uploads", "assignments");

    @Autowired
    private AssignmentService assignmentService;

    @PostMapping
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "CREATE_ASSIGNMENT", description = "Lecturer creates an assignment")
    public AssignmentResponse createAssignment(@RequestBody AssignmentRequest request) {
        return assignmentService.createAssignment(request);
    }

    @GetMapping("/course/{courseId}")
    public List<AssignmentResponse> getAssignmentsByCourse(@PathVariable Long courseId) {
        return assignmentService.getAssignmentsByCourse(courseId);
    }

    @PostMapping("/{assignmentId}/submit/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "SUBMIT_ASSIGNMENT", description = "Student submits assignment")
    public SubmissionResponse submitAssignment(
            @PathVariable Long assignmentId,
            @PathVariable Long studentId,
            @RequestBody SubmissionRequest request) {
        return assignmentService.submitAssignment(assignmentId, studentId, request);
    }

    @PostMapping("/upload/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public Map<String, String> uploadSubmissionFile(
            @PathVariable Long studentId,
            @RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file to upload.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be 10 MB or less.");
        }

        Files.createDirectories(UPLOAD_DIRECTORY);
        String originalName = file.getOriginalFilename() == null ? "submission" : file.getOriginalFilename();
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storedName = UUID.randomUUID() + "-" + safeName;
        Files.copy(file.getInputStream(), UPLOAD_DIRECTORY.resolve(storedName));

        return Map.of("fileUrl", "/uploads/assignments/" + storedName);
    }

    @PostMapping("/submissions/{submissionId}/grade/lecturer/{lecturerId}")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "GRADE_ASSIGNMENT", description = "Lecturer grades assignment submission")
    public SubmissionResponse gradeSubmission(
            @PathVariable Long submissionId,
            @PathVariable Long lecturerId,
            @RequestBody GradeRequest request) {
        return assignmentService.gradeSubmission(submissionId, request, lecturerId);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('INSTITUTE_ADMIN') or hasRole('LECTURER') or hasRole('SYSTEM_ADMIN') or hasRole('PARENT')")
    public List<SubmissionResponse> getSubmissionsByStudent(@PathVariable Long studentId) {
        return assignmentService.getSubmissionsByStudent(studentId);
    }

    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN') or hasRole('STUDENT')")
    public List<SubmissionResponse> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        return assignmentService.getSubmissionsByAssignment(assignmentId);
    }
}
