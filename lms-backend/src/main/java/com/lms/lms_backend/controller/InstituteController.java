package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.dto.InstituteRequest;
import com.lms.lms_backend.dto.InstituteResponse;
import com.lms.lms_backend.model.Institute;
import com.lms.lms_backend.repository.InstituteRepository;
import com.lms.lms_backend.service.InstituteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/institutes")
public class InstituteController {

    @Autowired
    private InstituteService instituteService;

    @Autowired
    private com.lms.lms_backend.repository.InstituteRepository instituteRepository;

    // PUBLIC endpoint — used on the Register page to list active institutes (no
    // auth required)
    @GetMapping("/public")
    public List<InstituteResponse> getPublicInstitutes() {
        return instituteService.getAllInstitutes().stream()
                .filter(i -> i.getStatus() == Institute.InstituteStatus.ACTIVE)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "CREATE_INSTITUTE", description = "System Admin creates an institute")
    public InstituteResponse createInstitute(@RequestBody InstituteRequest request) {
        return instituteService.createInstitute(request);
    }

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<InstituteResponse> getAllInstitutes() {
        return instituteService.getAllInstitutes();
    }

    @GetMapping("/{id:[0-9]+}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public Institute getInstituteById(@PathVariable Long id) {
        return instituteService.getInstituteById(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "UPDATE_INSTITUTE_STATUS", description = "System Admin updates institute status")
    public InstituteResponse updateStatus(@PathVariable Long id, @RequestParam Institute.InstituteStatus status) {
        return instituteService.updateInstituteStatus(id, status);
    }


    // ================================================
    // 1. GET ALL INSTITUTES WITH SUBSCRIPTION DETAILS (System Admin)
    // ================================================
    
    @GetMapping("/subscriptions")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<Institute> getAllInstitutesWithSubscriptions() {
        return instituteRepository.findAllByOrderBySubscriptionPlanAsc();
    }

    // ================================================
    // 2. UPDATE INSTITUTE SUBSCRIPTION PLAN (System Admin)
    // ================================================
    
    @PutMapping("/{instituteId}/subscription")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "UPDATE_SUBSCRIPTION", description = "System Admin updates institute subscription")
    public Institute updateSubscription(
            @PathVariable Long instituteId,
            @RequestParam Institute.SubscriptionPlan plan) {

        Institute institute = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new RuntimeException("Institute not found!"));

        institute.setSubscriptionPlan(plan);

        // If plan changed, extend end date by 1 month from today
        institute.setSubscriptionStartDate(LocalDateTime.now());
        institute.setSubscriptionEndDate(LocalDateTime.now().plusMonths(1));

        return instituteRepository.save(institute);
    }
}