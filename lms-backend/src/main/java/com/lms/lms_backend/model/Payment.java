package com.lms.lms_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long feeId;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Long paidBy; // Parent ID or Student ID

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private String reference; // Transaction Reference

    @Enumerated(EnumType.STRING)
    private PaymentStatus status = PaymentStatus.SUCCESS;

    @CreationTimestamp
    private LocalDateTime paidAt;

    public enum PaymentMethod {
        CASH,
        CARD,
        BANK_TRANSFER,
        ONLINE
    }

    public enum PaymentStatus {
        SUCCESS,
        FAILED,
        PENDING
    }
}