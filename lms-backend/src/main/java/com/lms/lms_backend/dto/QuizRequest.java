package com.lms.lms_backend.dto;

import lombok.Data;

@Data
public class QuizRequest {
    private String title;
    private String description;
    private Long courseId;
    private Integer durationMinutes;
    private Integer passingScore;
}