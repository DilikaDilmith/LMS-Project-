package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.QuizQuestion;
import lombok.Data;
import java.util.List;

@Data
public class QuestionRequest {
    private String questionText;
    private QuizQuestion.QuestionType questionType;
    private Integer marks;
    private List<OptionRequest> options; // MCQ/TF සඳහා
}