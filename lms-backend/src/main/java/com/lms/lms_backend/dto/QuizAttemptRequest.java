package com.lms.lms_backend.dto;

import lombok.Data;
import java.util.Map;

@Data
public class QuizAttemptRequest {
    // JSON object keys are strings; use String keys to avoid deserialization mismatches
    private Map<String, Long> selectedOptions; // questionId -> optionId
    private Map<String, String> shortAnswers;  // questionId -> answerText
}