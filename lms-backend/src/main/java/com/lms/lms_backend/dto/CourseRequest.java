package com.lms.lms_backend.dto;

import lombok.Data;

@Data
public class CourseRequest {
    private String name;
    private String description;
    private String thumbnailUrl;
    private Integer durationWeeks;
    private Long instituteId;
    private Long lecturerId;
}