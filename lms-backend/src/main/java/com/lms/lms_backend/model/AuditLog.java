package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private String username;

    private Long instituteId;

    @Column(nullable = false)
    private String action;

    @Column(length = 4000)
    private String details;

    private String ipAddress;

    @Column(nullable = false)
    private String status;

    @Column(length = 2000)
    private String errorMessage;

    @CreationTimestamp
    private LocalDateTime createdAt;
}