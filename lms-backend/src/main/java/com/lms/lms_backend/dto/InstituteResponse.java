package com.lms.lms_backend.dto;

import com.lms.lms_backend.model.Institute;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class InstituteResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private Institute.InstituteStatus status;
    private Institute.SubscriptionPlan subscriptionPlan;
    private LocalDateTime subscriptionEndDate;
}