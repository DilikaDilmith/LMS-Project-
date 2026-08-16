package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.Course;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String name;
    private String description;
    private String thumbnailUrl;
    private Integer durationWeeks;
    private Long instituteId;
    private Long lecturerId;
    private Course.CourseStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
}