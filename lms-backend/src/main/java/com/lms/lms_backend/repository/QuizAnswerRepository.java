package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {
    List<QuizAnswer> findByAttemptId(Long attemptId);
}