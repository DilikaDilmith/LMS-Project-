package com.lms.lms_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AssignmentResponse {
    private Long id;
    private String title;
    private String description;
    private Long courseId;
    private Long lecturerId;
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private String attachmentUrl;
    private LocalDateTime createdAt;
}