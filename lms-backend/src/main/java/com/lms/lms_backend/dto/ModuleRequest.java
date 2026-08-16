package com.lms.lms_backend.dto;

import lombok.Data;

@Data
public class ModuleRequest {
    private String title;
    private String description;
    private Long courseId;
    private Integer orderIndex;
}