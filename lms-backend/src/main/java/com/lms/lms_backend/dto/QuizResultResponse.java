package com.lms.lms_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QuizResultResponse {
    private Long attemptId;
    private Integer score;
    private Integer totalMarks;
    private Boolean isPassed;
    private String status;
}