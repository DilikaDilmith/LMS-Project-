package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_lesson_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentLessonProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private Long lessonId;

    private Boolean isCompleted = false;

    @CreationTimestamp
    private LocalDateTime completedAt;
}