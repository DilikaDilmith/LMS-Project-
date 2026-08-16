package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.*;
import com.lms.lms_backend.model.*;
import com.lms.lms_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

    @Autowired
    private UserRepository userRepository;

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
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!currentUser.getId().equals(studentId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only submit a quiz for your own student account (ID: " + currentUser.getId() + ")");
        }

        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz not found"));

        if (attemptRepository.findByQuizIdAndStudentId(quizId, studentId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already attempted this quiz");
        }

        // 1. Create Attempt
        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuizId(quizId);
        attempt.setStudentId(studentId);
        attempt.setStartTime(LocalDateTime.now());
        attempt.setStatus(QuizAttempt.AttemptStatus.STARTED);

        QuizAttempt savedAttempt = attemptRepository.save(attempt);

        // 2. Get Questions
        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        int totalMarks = 0;
        int scoredMarks = 0;

        Map<String, Long> selectedOptions = request.getSelectedOptions();
        Map<String, String> shortAnswers = request.getShortAnswers();

        // 3. Process Answers
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

        // 4. Update Attempt
        savedAttempt.setScore(scoredMarks);
        savedAttempt.setEndTime(LocalDateTime.now());
        savedAttempt.setIsPassed(scoredMarks >= (totalMarks * quiz.getPassingScore() / 100));
        savedAttempt.setStatus(QuizAttempt.AttemptStatus.COMPLETED);

        QuizAttempt updatedAttempt = attemptRepository.save(savedAttempt);

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