package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId; // Receiver

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type = NotificationType.INFO;

    private Boolean isRead = false;

    private String linkUrl; // Optional (e.g., /assignments/1)

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum NotificationType {
        INFO,
        SUCCESS,
        WARNING,
        ERROR
    }
}