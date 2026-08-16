package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long assignmentId;

    @Column(nullable = false)
    private Long studentId;

    private String fileUrl; // Student submit කරපු file

    @Enumerated(EnumType.STRING)
    private SubmissionStatus status = SubmissionStatus.NOT_SUBMITTED;

    private Integer marks;

    @Column(length = 1000)
    private String feedback;

    private Long gradedBy; // Lecturer ID

    private LocalDateTime gradedAt;

    @CreationTimestamp
    private LocalDateTime submittedAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum SubmissionStatus {
        NOT_SUBMITTED,
        SUBMITTED,
        LATE,
        GRADED,
        RESUBMISSION_REQUESTED
    }
}