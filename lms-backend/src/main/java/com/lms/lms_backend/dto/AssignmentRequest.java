package com.lms.lms_backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignmentRequest {
    private String title;
    private String description;
    private Long courseId;
    private Long lecturerId;

    @JsonFormat(pattern = "yyyy-MM-dd['T'HH:mm[:ss]]")
    private LocalDateTime dueDate;
    private Integer maxMarks;
    private String attachmentUrl;
}