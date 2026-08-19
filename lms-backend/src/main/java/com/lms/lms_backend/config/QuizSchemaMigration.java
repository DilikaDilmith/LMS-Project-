package com.lms.lms_backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class QuizSchemaMigration {

    /**
     * Hibernate's update mode does not expand existing MySQL ENUM columns.
     * Keep the database column aligned with QuizQuestion.QuestionType.
     */
    @Bean
    CommandLineRunner migrateQuizQuestionTypes(JdbcTemplate jdbcTemplate) {
        return args -> jdbcTemplate.execute("""
                ALTER TABLE quiz_questions
                MODIFY COLUMN question_type
                ENUM ('MCQ', 'TRUE_FALSE', 'MULTIPLE_SELECT', 'SHORT_ANSWER') NOT NULL
                """);
    }
}
