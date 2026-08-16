package com.lms.lms_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class LessonResponse {
    private Long id;
    private String title;
    private String description;
    private String videoUrl;
    private String pdfUrl;
    private Long moduleId;
    private Integer orderIndex;
    private Integer durationMinutes;
    private Boolean isPublished;
    private LocalDateTime createdAt;
}