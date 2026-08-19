package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.AssignmentSubmission;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class SubmissionResponse {
    private Long id;
    private Long assignmentId;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String fileUrl;
    private AssignmentSubmission.SubmissionStatus status;
    private Integer marks;
    private String feedback;
    private LocalDateTime submittedAt;
}