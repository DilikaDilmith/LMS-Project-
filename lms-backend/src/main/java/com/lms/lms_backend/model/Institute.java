package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "institutes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Institute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(unique = true)
    private String registrationNumber;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;
    private String address;
    private String logoUrl;

    @Enumerated(EnumType.STRING)
    private InstituteStatus status = InstituteStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.BASIC;

    private LocalDateTime subscriptionStartDate;
    private LocalDateTime subscriptionEndDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Enums
    public enum InstituteStatus {
        PENDING, ACTIVE, SUSPENDED, EXPIRED
    }

    public enum SubscriptionPlan {
        BASIC, STANDARD, PREMIUM
    }
}