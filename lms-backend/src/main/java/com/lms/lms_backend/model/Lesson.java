package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    private String videoUrl;      // YouTube video link හෝ uploaded video URL
    private String pdfUrl;        // PDF materials link

    @Column(nullable = false)
    private Long moduleId;

    @Column(nullable = false)
    private Integer orderIndex;    // පාඩමේ පිළිවෙල

    private Integer durationMinutes; // විනාඩි වලින්

    private Boolean isPublished = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moduleId", insertable = false, updatable = false)
    private Module module;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}