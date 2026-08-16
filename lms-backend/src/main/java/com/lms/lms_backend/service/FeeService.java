package com.lms.lms_backend.service;

import com.lms.lms_backend.model.Course;
import com.lms.lms_backend.model.Fee;
import com.lms.lms_backend.model.Notification;
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

    // 👇 Notification Service Inject කරන්න
    @Autowired
    private NotificationService notificationService;

    public Fee generateFeeForStudent(Long studentId, Long courseId, Double amount) {
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

    @Transactional
    public Fee autoGenerateFeeOnEnrollment(Long studentId, Long courseId, Double courseFee) {
        return generateFeeForStudent(studentId, courseId, courseFee);
    }

    @Transactional
    public Payment recordPayment(Long feeId, Double amount, Long paidBy, Payment.PaymentMethod method, String reference) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new RuntimeException("Fee not found!"));

        Payment payment = new Payment();
        payment.setFeeId(feeId);
        payment.setAmount(amount);
        payment.setPaidBy(paidBy);
        payment.setPaymentMethod(method);
        payment.setReference(reference);
        payment.setStatus(Payment.PaymentStatus.SUCCESS);

        Payment savedPayment = paymentRepository.save(payment);

        double newPaidAmount = fee.getPaidAmount() + amount;
        fee.setPaidAmount(newPaidAmount);

        Fee.FeeStatus previousStatus = fee.getStatus();
        if (newPaidAmount >= fee.getTotalAmount()) {
            fee.setStatus(Fee.FeeStatus.PAID);
        } else if (newPaidAmount > 0) {
            fee.setStatus(Fee.FeeStatus.PARTIAL);
        }

        feeRepository.save(fee);

        // 👇 **NEW: Notification එක Send කරනවා (Student ට / Parent ට)**
        try {
            Long studentId = fee.getStudentId();
            String title = "Payment Confirmation";
            String message = "A payment of Rs." + amount + " has been successfully recorded.\n" +
                             "Total Paid: Rs." + newPaidAmount + " / Rs." + fee.getTotalAmount() + "\n" +
                             "Status: " + fee.getStatus().name();
            notificationService.createNotification(
                    studentId,
                    title,
                    message,
                    Notification.NotificationType.SUCCESS,
                    "/fees/" + feeId
            );
            // අමතරව Parent ටත් Notify කරන්න ඕනේ නම්, Parent ID එක හොයලා add කරන්න.
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }

        return savedPayment;
    }

    public Fee getStudentFee(Long studentId, Long courseId) {
        return feeRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Fee not found for this student and course!"));
    }

    public List<Fee> getStudentAllFees(Long studentId) {
        return feeRepository.findByStudentId(studentId);
    }

    public List<Payment> getStudentPaymentHistory(Long studentId) {
        return paymentRepository.findByPaidBy(studentId);
    }

    public void checkAndUpdateOverdueFees() {
        // Future logic if needed
    }
}