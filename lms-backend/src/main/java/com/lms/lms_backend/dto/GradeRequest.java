package com.lms.lms_backend.dto;

import lombok.Data;

@Data
public class GradeRequest {
    private Integer marks;
    private String feedback;
}