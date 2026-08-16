package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String phone;
    private Role role;
    private Long instituteId;
}