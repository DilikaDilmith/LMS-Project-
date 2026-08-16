package com.lms.lms_backend.dto;

import lombok.Data;

@Data
public class OptionRequest {
    private String optionText;
    private Boolean isCorrect;
}