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
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "CREATE_QUIZ", description = "Lecturer creates a quiz")
    public Quiz createQuiz(@RequestBody QuizRequest request) {
        return quizService.createQuiz(request);
    }

    @PutMapping("/{quizId}")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "UPDATE_QUIZ", description = "Lecturer updates a quiz")
    public Quiz updateQuiz(@PathVariable Long quizId, @RequestBody QuizRequest request) {
        return quizService.updateQuiz(quizId, request);
    }

    @DeleteMapping("/{quizId}")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "DELETE_QUIZ", description = "Lecturer deletes a quiz")
    public void deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
    }

    @PostMapping("/{quizId}/questions")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
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
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "SUBMIT_QUIZ", description = "Student submits quiz")
    public QuizResultResponse submitQuiz(
            @PathVariable Long quizId,
            @PathVariable Long studentId,
            @RequestBody QuizAttemptRequest request) {
        return quizService.submitQuiz(quizId, studentId, request);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('INSTITUTE_ADMIN') or hasRole('LECTURER') or hasRole('SYSTEM_ADMIN') or hasRole('PARENT')")
    public List<QuizAttempt> getStudentResults(@PathVariable Long studentId) {
        return quizService.getStudentQuizResults(studentId);
    }

    // ✅ Lecturer sees all student submissions for a specific quiz
    @GetMapping("/{quizId}/submissions")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<QuizAttempt> getQuizSubmissions(@PathVariable Long quizId) {
        return quizService.getQuizSubmissions(quizId);
    }

    // ✅ Lecturer sees all student submissions across all quizzes in a course
    @GetMapping("/course/{courseId}/submissions")
    @PreAuthorize("hasRole('LECTURER') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<QuizAttempt> getQuizSubmissionsByCourse(@PathVariable Long courseId) {
        return quizService.getQuizSubmissionsByCourse(courseId);
    }
}
