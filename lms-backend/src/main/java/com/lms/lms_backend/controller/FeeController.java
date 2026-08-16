package com.lms.lms_backend.controller;

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

    // Student කෙනෙකුට Fee Generate කරනවා (System Admin/Institute Admin/Lecturer)
    @PostMapping("/generate")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('LECTURER')")
    public Fee generateFee(@RequestParam Long studentId, @RequestParam Long courseId, @RequestParam Double amount) {
        return feeService.generateFeeForStudent(studentId, courseId, amount);
    }

    // Student ගේ Fee Details එක ගන්නවා
    @GetMapping("/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('STUDENT') or hasRole('PARENT')")
    public Fee getStudentFee(@PathVariable Long studentId, @PathVariable Long courseId) {
        return feeService.getStudentFee(studentId, courseId);
    }

    // Student ගේ හැම Fee එකම ගන්නවා
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('STUDENT') or hasRole('PARENT')")
    public List<Fee> getStudentAllFees(@PathVariable Long studentId) {
        return feeService.getStudentAllFees(studentId);
    }

    // Payment Record කරනවා
    @PostMapping("/payment")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('PARENT') or hasRole('STUDENT')")
    public Payment recordPayment(
            @RequestParam Long feeId,
            @RequestParam Double amount,
            @RequestParam Long paidBy,
            @RequestParam Payment.PaymentMethod method,
            @RequestParam(required = false) String reference) {
        return feeService.recordPayment(feeId, amount, paidBy, method, reference);
    }

    // Student ගේ Payment History එක
    @GetMapping("/payments/student/{studentId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('STUDENT') or hasRole('PARENT')")
    public List<Payment> getStudentPayments(@PathVariable Long studentId) {
        return feeService.getStudentPaymentHistory(studentId);
    }
}