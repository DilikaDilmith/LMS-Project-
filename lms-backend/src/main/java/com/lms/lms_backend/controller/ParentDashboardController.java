package com.lms.lms_backend.controller;

import com.lms.lms_backend.service.ParentDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parent/dashboard")
public class ParentDashboardController {

    @Autowired
    private ParentDashboardService dashboardService;

    // Parent ගේ හැම Child ගේම Dashboard Data එක ගන්න
    @GetMapping("/{parentId}")
    @PreAuthorize("hasRole('PARENT') or hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN')")
    public List<ParentDashboardService.ChildDashboardData> getDashboard(@PathVariable Long parentId) {
        return dashboardService.getParentDashboard(parentId);
    }
}