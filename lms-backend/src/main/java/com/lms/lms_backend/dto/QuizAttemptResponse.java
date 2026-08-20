package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.QuizAttempt;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class QuizAttemptResponse {
    private Long id;
    private Long quizId;
    private Long studentId;
    private Integer score;
    private Boolean isPassed;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime attemptedAt;
    private QuizAttempt.AttemptStatus status;
}
