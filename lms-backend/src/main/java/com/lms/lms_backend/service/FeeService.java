package com.lms.lms_backend.service;

import com.lms.lms_backend.model.Course;
import com.lms.lms_backend.model.Enrollment;
import com.lms.lms_backend.model.Fee;
import com.lms.lms_backend.model.Payment;
import com.lms.lms_backend.repository.CourseRepository;
import com.lms.lms_backend.repository.EnrollmentRepository;
import com.lms.lms_backend.repository.FeeRepository;
import com.lms.lms_backend.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FeeService {

    @Autowired
    private FeeRepository feeRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    // Course Fee එක Create කරනවා (Course එකට)
    public Fee setCourseFee(Long courseId, Double amount) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        // Enrollment තියෙන Students ට Fee Update කරන්න ඕනේ නම් ලොගික් එක මෙතන දාන්න පුළුවන්
        return null; // මේක වෙනම method එකක් හදමු
    }

    // Student කෙනෙකුට Fee Generate කරනවා (Enrollment වෙනකොට)
    @Transactional
    public Fee generateFeeForStudent(Long studentId, Long courseId, Double amount) {
        // Fee දැනටමත් තියෙනවද?
        if (feeRepository.findByStudentIdAndCourseId(studentId, courseId).isPresent()) {
            throw new RuntimeException("Fee already exists for this student and course!");
        }

        Fee fee = new Fee();
        fee.setStudentId(studentId);
        fee.setCourseId(courseId);
        fee.setTotalAmount(amount);
        fee.setPaidAmount(0.0);
        fee.setStatus(Fee.FeeStatus.PENDING);

        return feeRepository.save(fee);
    }

    // Enrollment වෙනකොට Auto Fee Generate කරන්න
    @Transactional
    public Fee autoGenerateFeeOnEnrollment(Long studentId, Long courseId, Double courseFee) {
        return generateFeeForStudent(studentId, courseId, courseFee);
    }

    // Payment Record කරනවා
    @Transactional
    public Payment recordPayment(Long feeId, Double amount, Long paidBy, Payment.PaymentMethod method, String reference) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new RuntimeException("Fee not found!"));

        // Payment Record එක Save කරනවා
        Payment payment = new Payment();
        payment.setFeeId(feeId);
        payment.setAmount(amount);
        payment.setPaidBy(paidBy);
        payment.setPaymentMethod(method);
        payment.setReference(reference);
        payment.setStatus(Payment.PaymentStatus.SUCCESS);

        Payment savedPayment = paymentRepository.save(payment);

        // Fee Status Update කරනවා
        double newPaidAmount = fee.getPaidAmount() + amount;
        fee.setPaidAmount(newPaidAmount);

        if (newPaidAmount >= fee.getTotalAmount()) {
            fee.setStatus(Fee.FeeStatus.PAID);
        } else if (newPaidAmount > 0) {
            fee.setStatus(Fee.FeeStatus.PARTIAL);
        }

        feeRepository.save(fee);
        return savedPayment;
    }

    // Student ගේ Fee Details එක ගන්නවා
    public Fee getStudentFee(Long studentId, Long courseId) {
        return feeRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Fee not found for this student and course!"));
    }

    // Student ගේ හැම Fee එකම ගන්නවා
    public List<Fee> getStudentAllFees(Long studentId) {
        return feeRepository.findByStudentId(studentId);
    }

    // Student ගේ Fee Payments ඉතිහාසය ගන්නවා
    public List<Payment> getStudentPaymentHistory(Long studentId) {
        return paymentRepository.findByPaidBy(studentId);
    }

    // Fee Status Update කරනවා (Overdue Check - Scheduler එකකින් මේක call කරන්න පුළුවන්)
    public void checkAndUpdateOverdueFees() {
        List<Fee> fees = feeRepository.findAll();
        for (Fee fee : fees) {
            if (fee.getStatus() == Fee.FeeStatus.PENDING || fee.getStatus() == Fee.FeeStatus.PARTIAL) {
                // අමතර logic: due date එකක් තියෙනවා නම් overdue check කරන්න
                // දැනට අපිට due date නැහැ, ඉතින් මේක ටිකක් අමතරවෙයි
            }
        }
    }
}