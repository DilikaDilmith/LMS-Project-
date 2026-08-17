package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.dto.*;
import com.lms.lms_backend.model.Quiz;
import com.lms.lms_backend.model.QuizAttempt;
import com.lms.lms_backend.model.QuizQuestion;
import com.lms.lms_backend.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @PostMapping
    @PreAuthorize("hasRole('LECTURER')")
    @Auditable(action = "CREATE_QUIZ", description = "Lecturer creates a quiz")
    public Quiz createQuiz(@RequestBody QuizRequest request) {
        return quizService.createQuiz(request);
    }

    @PostMapping("/{quizId}/questions")
    @PreAuthorize("hasRole('LECTURER')")
    @Auditable(action = "ADD_QUIZ_QUESTION", description = "Lecturer adds question to quiz")
    public QuizQuestion addQuestion(@PathVariable Long quizId, @RequestBody QuestionRequest request) {
        return quizService.addQuestionToQuiz(quizId, request);
    }

    @GetMapping("/course/{courseId}")
    public List<Quiz> getQuizzesByCourse(@PathVariable Long courseId) {
        return quizService.getQuizzesByCourse(courseId);
    }

    @GetMapping("/{quizId}")
    public Quiz getQuizById(@PathVariable Long quizId) {
        return quizService.getQuizById(quizId);
    }

    @GetMapping("/{quizId}/questions")
    public List<QuizQuestion> getQuestionsForQuiz(@PathVariable Long quizId) {
        return quizService.getQuestionsForQuiz(quizId);
    }

    @PostMapping("/{quizId}/submit/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Auditable(action = "SUBMIT_QUIZ", description = "Student submits quiz")
    public QuizResultResponse submitQuiz(
            @PathVariable Long quizId,
            @PathVariable Long studentId,
            @RequestBody QuizAttemptRequest request) {
        return quizService.submitQuiz(quizId, studentId, request);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('INSTITUTE_ADMIN')")
    public List<QuizAttempt> getStudentResults(@PathVariable Long studentId) {
        return quizService.getStudentQuizResults(studentId);
    }
}