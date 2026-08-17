package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.model.Fee;
import com.lms.lms_backend.model.Payment;
import com.lms.lms_backend.service.FeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fees")
public class FeeController {

    @Autowired
    private FeeService feeService;

    @PostMapping("/generate")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('LECTURER')")
    @Auditable(action = "GENERATE_FEE", description = "Fee generated for student")
    public Fee generateFee(@RequestParam Long studentId, @RequestParam Long courseId, @RequestParam Double amount) {
        return feeService.generateFeeForStudent(studentId, courseId, amount);
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('STUDENT') or hasRole('PARENT')")
    public Fee getStudentFee(@PathVariable Long studentId, @PathVariable Long courseId) {
        return feeService.getStudentFee(studentId, courseId);
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('STUDENT') or hasRole('PARENT')")
    public List<Fee> getStudentAllFees(@PathVariable Long studentId) {
        return feeService.getStudentAllFees(studentId);
    }

    @PostMapping("/payment")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('PARENT') or hasRole('STUDENT')")
    @Auditable(action = "RECORD_PAYMENT", description = "Payment recorded for fee")
    public Payment recordPayment(
            @RequestParam Long feeId,
            @RequestParam Double amount,
            @RequestParam Long paidBy,
            @RequestParam Payment.PaymentMethod method,
            @RequestParam(required = false) String reference) {
        return feeService.recordPayment(feeId, amount, paidBy, method, reference);
    }

    @GetMapping("/payments/student/{studentId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('STUDENT') or hasRole('PARENT')")
    public List<Payment> getStudentPayments(@PathVariable Long studentId) {
        return feeService.getStudentPaymentHistory(studentId);
    }
}