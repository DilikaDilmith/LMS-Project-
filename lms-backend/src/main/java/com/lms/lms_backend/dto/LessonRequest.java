package com.lms.lms_backend.dto;

import lombok.Data;

@Data
public class LessonRequest {
    private String title;
    private String description;
    private String videoUrl;
    private String pdfUrl;
    private Long moduleId;
    private Integer orderIndex;
    private Integer durationMinutes;
    private Boolean isPublished;
}