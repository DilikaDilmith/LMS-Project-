package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "parent_students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParentStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long parentId;

    @Column(nullable = false)
    private Long studentId;

    @CreationTimestamp
    private LocalDateTime linkedAt;
}