package com.lms.lms_backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignmentRequest {
    private String title;
    private String description;
    private Long courseId;
    private Long lecturerId;
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private String attachmentUrl;
}