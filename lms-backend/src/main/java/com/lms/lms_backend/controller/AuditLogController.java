package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.AuditLog;
import com.lms.lms_backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN')")
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAll();
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN')")
    public List<AuditLog> getLogsByUser(@PathVariable Long userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN')")
    public List<AuditLog> getLogsByAction(@PathVariable String action) {
        return auditLogRepository.findByActionOrderByCreatedAtDesc(action);
    }

    @GetMapping("/institute")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<AuditLog> getInstituteLogs() {
        // Implement using TenantContext
        return auditLogRepository.findAll();
    }
}