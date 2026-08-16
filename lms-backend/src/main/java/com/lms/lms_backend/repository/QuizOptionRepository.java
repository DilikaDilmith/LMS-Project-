package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.QuizOption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {
    List<QuizOption> findByQuestionId(Long questionId);
    QuizOption findByQuestionIdAndIsCorrectTrue(Long questionId);
}