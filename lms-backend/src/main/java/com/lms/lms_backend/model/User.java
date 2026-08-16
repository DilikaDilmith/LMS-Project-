package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data          // Getter/Setter toString ඔක්කොම හදලා දෙනවා
@NoArgsConstructor   // Empty Constructor එක
@AllArgsConstructor  // All arguments Constructor එක
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // Hash කරලා තමයි save කරන්නේ

    @Column(nullable = false)
    private String firstName;

    private String lastName;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    // Multi-tenancy එකට (System Adminට NULL වෙන්න පුළුවන්)
    private Long instituteId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}