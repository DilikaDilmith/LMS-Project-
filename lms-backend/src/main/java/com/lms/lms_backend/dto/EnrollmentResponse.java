package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.Enrollment;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long courseId;
    private String courseName; // Course එකේ Name එකත් එක්කම යවමු
    private Long instituteId;
    private Enrollment.EnrollmentStatus status;
    private LocalDateTime enrolledAt;
}