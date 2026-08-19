package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByStudentId(Long studentId);
    Optional<QuizAttempt> findByQuizIdAndStudentId(Long quizId, Long studentId);
    List<QuizAttempt> findByQuizId(Long quizId);
    List<QuizAttempt> findByQuizIdIn(List<Long> quizIds);
}