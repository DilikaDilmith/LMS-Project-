package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.*;
import com.lms.lms_backend.model.*;
import com.lms.lms_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizQuestionRepository questionRepository;

    @Autowired
    private QuizOptionRepository optionRepository;

    @Autowired
    private QuizAttemptRepository attemptRepository;

    @Autowired
    private QuizAnswerRepository answerRepository;

    @Autowired
    private CourseRepository courseRepository;

    // 👇 Notification Service Inject කරන්න
    @Autowired
    private NotificationService notificationService;

    public Quiz createQuiz(QuizRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setCourseId(request.getCourseId());
        quiz.setDurationMinutes(request.getDurationMinutes());
        quiz.setPassingScore(request.getPassingScore());

        return quizRepository.save(quiz);
    }

    @Transactional
    public QuizQuestion addQuestionToQuiz(Long quizId, QuestionRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found!"));

        QuizQuestion question = new QuizQuestion();
        question.setQuizId(quizId);
        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setMarks(request.getMarks());

        QuizQuestion savedQuestion = questionRepository.save(question);

        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (OptionRequest optReq : request.getOptions()) {
                QuizOption option = new QuizOption();
                option.setQuestionId(savedQuestion.getId());
                option.setOptionText(optReq.getOptionText());
                option.setIsCorrect(optReq.getIsCorrect());
                optionRepository.save(option);
            }
        }

        return savedQuestion;
    }

    public List<Quiz> getQuizzesByCourse(Long courseId) {
        return quizRepository.findByCourseId(courseId);
    }

    @Transactional
    public QuizResultResponse submitQuiz(Long quizId, Long studentId, QuizAttemptRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found!"));

        if (attemptRepository.findByQuizIdAndStudentId(quizId, studentId).isPresent()) {
            throw new RuntimeException("You have already attempted this quiz!");
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuizId(quizId);
        attempt.setStudentId(studentId);
        attempt.setStartTime(LocalDateTime.now());
        attempt.setStatus(QuizAttempt.AttemptStatus.STARTED);

        QuizAttempt savedAttempt = attemptRepository.save(attempt);

        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        int totalMarks = 0;
        int scoredMarks = 0;

        Map<String, Long> selectedOptions = request.getSelectedOptions();
        Map<String, String> shortAnswers = request.getShortAnswers();

        for (QuizQuestion question : questions) {
            totalMarks += question.getMarks();

            QuizAnswer answer = new QuizAnswer();
            answer.setAttemptId(savedAttempt.getId());
            answer.setQuestionId(question.getId());

            if (question.getQuestionType() == QuizQuestion.QuestionType.MCQ ||
                question.getQuestionType() == QuizQuestion.QuestionType.TRUE_FALSE) {

                Long selectedOptionId = null;
                String questionKey = String.valueOf(question.getId());
                if (selectedOptions != null && selectedOptions.containsKey(questionKey)) {
                    selectedOptionId = selectedOptions.get(questionKey);
                }
                answer.setSelectedOptionId(selectedOptionId);

                if (selectedOptionId != null) {
                    QuizOption correctOption = optionRepository.findByQuestionIdAndIsCorrectTrue(question.getId());
                    if (correctOption != null && correctOption.getId().equals(selectedOptionId)) {
                        answer.setIsCorrect(true);
                        scoredMarks += question.getMarks();
                    }
                }

            } else if (question.getQuestionType() == QuizQuestion.QuestionType.SHORT_ANSWER) {
                String answerText = null;
                String questionKey = String.valueOf(question.getId());
                if (shortAnswers != null && shortAnswers.containsKey(questionKey)) {
                    answerText = shortAnswers.get(questionKey);
                }
                answer.setShortAnswerText(answerText);
                answer.setIsCorrect(false);
            }

            answerRepository.save(answer);
        }

        savedAttempt.setScore(scoredMarks);
        savedAttempt.setEndTime(LocalDateTime.now());
        savedAttempt.setIsPassed(scoredMarks >= (totalMarks * quiz.getPassingScore() / 100));
        savedAttempt.setStatus(QuizAttempt.AttemptStatus.COMPLETED);

        QuizAttempt updatedAttempt = attemptRepository.save(savedAttempt);

        // 👇 **NEW: Notification එක Send කරනවා (Student ට)**
        try {
            String title = "Quiz Result: " + quiz.getTitle();
            String message = "You scored " + scoredMarks + "/" + totalMarks + " in '" + quiz.getTitle() + "'.\n" +
                             "Result: " + (updatedAttempt.getIsPassed() ? "✅ PASSED" : "❌ FAILED") +
                             " (Passing Score: " + quiz.getPassingScore() + "%)";
            notificationService.createNotification(
                    studentId,
                    title,
                    message,
                    updatedAttempt.getIsPassed() ? Notification.NotificationType.SUCCESS : Notification.NotificationType.WARNING,
                    "/quizzes/" + quizId + "/results"
            );
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return new QuizResultResponse(
                updatedAttempt.getId(),
                updatedAttempt.getScore(),
                totalMarks,
                updatedAttempt.getIsPassed(),
                "COMPLETED"
        );
    }

    public List<QuizAttempt> getStudentQuizResults(Long studentId) {
        return attemptRepository.findByStudentId(studentId);
    }
}