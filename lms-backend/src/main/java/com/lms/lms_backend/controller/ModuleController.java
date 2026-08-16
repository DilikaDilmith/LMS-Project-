package com.lms.lms_backend.controller;

import com.lms.lms_backend.dto.ModuleRequest;
import com.lms.lms_backend.dto.ModuleResponse;
import com.lms.lms_backend.service.ModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {

    @Autowired
    private ModuleService moduleService;

    @PostMapping
    @PreAuthorize("hasRole('LECTURER')")
    public ModuleResponse createModule(@RequestBody ModuleRequest request) {
        return moduleService.createModule(request);
    }

    @GetMapping("/course/{courseId}")
    public List<ModuleResponse> getModulesByCourse(@PathVariable Long courseId) {
        return moduleService.getModulesByCourse(courseId);
    }

    @DeleteMapping("/{moduleId}")
    @PreAuthorize("hasRole('LECTURER')")
    public String deleteModule(@PathVariable Long moduleId) {
        moduleService.deleteModule(moduleId);
        return "Module deleted successfully!";
    }
}