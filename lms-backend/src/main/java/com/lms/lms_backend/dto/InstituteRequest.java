package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.Institute;
import lombok.Data;

@Data
public class InstituteRequest {
    private String name;
    private String registrationNumber;
    private String email;
    private String phone;
    private String address;
    private String logoUrl;
    private Institute.SubscriptionPlan subscriptionPlan;
}