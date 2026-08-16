package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByFeeId(Long feeId);
    List<Payment> findByPaidBy(Long userId);
}