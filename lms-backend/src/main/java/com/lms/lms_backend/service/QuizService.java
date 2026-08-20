package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.*;
import com.lms.lms_backend.model.*;
import com.lms.lms_backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    // 👇 Notification Service Inject කරන්න
    @Autowired
    private NotificationService notificationService;

    public Quiz createQuiz(QuizRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));
        ensureQuizManagementAccess(course);

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setCourseId(request.getCourseId());
        quiz.setDurationMinutes(request.getDurationMinutes());
        quiz.setPassingScore(request.getPassingScore());

        return quizRepository.save(quiz);
    }

    @Transactional
    public Quiz updateQuiz(Long quizId, QuizRequest request) {
        Quiz quiz = getQuizById(quizId);
        Course course = courseRepository.findById(quiz.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));
        ensureQuizManagementAccess(course);

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setDurationMinutes(request.getDurationMinutes());
        quiz.setPassingScore(request.getPassingScore());
        return quizRepository.save(quiz);
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        Quiz quiz = getQuizById(quizId);
        Course course = courseRepository.findById(quiz.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));
        ensureQuizManagementAccess(course);

        if (!attemptRepository.findByQuizId(quizId).isEmpty()) {
            throw new RuntimeException("This quiz has student submissions and cannot be deleted.");
        }

        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        for (QuizQuestion question : questions) {
            optionRepository.deleteAll(optionRepository.findByQuestionId(question.getId()));
        }
        questionRepository.deleteAll(questions);
        quizRepository.delete(quiz);
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

        // Check if student is enrolled; if not, ensure active enrollment is recorded
        boolean isEnrolled = enrollmentRepository.findByStudentIdAndCourseId(studentId, quiz.getCourseId())
                .map(enrollment -> enrollment.getStatus() != Enrollment.EnrollmentStatus.DROPPED)
                .orElse(false);
        if (!isEnrolled) {
            Course course = courseRepository.findById(quiz.getCourseId()).orElse(null);
            if (course != null) {
                Enrollment enrollment = new Enrollment();
                enrollment.setStudentId(studentId);
                enrollment.setCourseId(course.getId());
                enrollment.setInstituteId(course.getInstituteId() != null ? course.getInstituteId() : 1L);
                enrollment.setStatus(Enrollment.EnrollmentStatus.ACTIVE);
                enrollmentRepository.save(enrollment);
            }
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
        savedAttempt.setAttemptedAt(LocalDateTime.now());
        savedAttempt.setIsPassed(scoredMarks >= (totalMarks * quiz.getPassingScore() / 100));
        savedAttempt.setStatus(QuizAttempt.AttemptStatus.COMPLETED);

        QuizAttempt updatedAttempt = attemptRepository.save(savedAttempt);

        // 👇 **Notification එක Send කරනවා (Student ට)**
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

    @Transactional(readOnly = true)
    public List<QuizAttemptResponse> getStudentQuizResults(Long studentId) {
        return attemptRepository.findByStudentId(studentId).stream()
                .map(attempt -> new QuizAttemptResponse(
                        attempt.getId(),
                        attempt.getQuizId(),
                        attempt.getStudentId(),
                        attempt.getScore(),
                        attempt.getIsPassed(),
                        attempt.getStartTime(),
                        attempt.getEndTime(),
                        attempt.getAttemptedAt() != null ? attempt.getAttemptedAt() : (attempt.getEndTime() != null ? attempt.getEndTime() : attempt.getStartTime()),
                        attempt.getStatus()
                ))
                .collect(Collectors.toList());
    }

    // Get all student attempts for a specific quiz (for Lecturer)
    public List<QuizAttempt> getQuizSubmissions(Long quizId) {
        return attemptRepository.findByQuizId(quizId);
    }

    // Get all student attempts across all quizzes for a course (for Lecturer)
    public List<QuizAttempt> getQuizSubmissionsByCourse(Long courseId) {
        List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
        List<Long> quizIds = quizzes.stream().map(Quiz::getId).collect(Collectors.toList());
        if (quizIds.isEmpty()) return List.of();
        return attemptRepository.findByQuizIdIn(quizIds);
    }

    public Quiz getQuizById(Long quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found!"));
    }

    public List<QuizQuestion> getQuestionsForQuiz(Long quizId) {
        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        for (QuizQuestion q : questions) {
            List<QuizOption> options = optionRepository.findByQuestionId(q.getId());
            q.setOptions(options);
        }
        return questions;
    }

    private void ensureQuizManagementAccess(Course course) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found!"));

        if (user.getRole() == Role.ROLE_SYSTEM_ADMIN) {
            return;
        }
        if (user.getRole() == Role.ROLE_INSTITUTE_ADMIN
                && user.getInstituteId() != null
                && user.getInstituteId().equals(course.getInstituteId())) {
            return;
        }
        if (user.getRole() == Role.ROLE_LECTURER && user.getId().equals(course.getLecturerId())) {
            return;
        }
        throw new RuntimeException("You can only manage quizzes for courses you teach.");
    }
}
