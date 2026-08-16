package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 5000)
    private String message;

    // Target Audience
    private Long instituteId; // Null = Global (System Admin only)
    private Long courseId;    // Null = Institute-wide

    @Enumerated(EnumType.STRING)
    private TargetRole targetRole; // STUDENT, LECTURER, PARENT, ALL

    @Column(nullable = false)
    private Long createdBy; // User ID

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum TargetRole {
        STUDENT,
        LECTURER,
        PARENT,
        ALL
    }
}