package com.lms.lms_backend.controller;

import com.lms.lms_backend.dto.InstituteRequest;
import com.lms.lms_backend.dto.InstituteResponse;
import com.lms.lms_backend.model.Institute;
import com.lms.lms_backend.service.InstituteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institutes")
public class InstituteController {

    @Autowired
    private InstituteService instituteService;

    @PostMapping
    public InstituteResponse createInstitute(@RequestBody InstituteRequest request) {
        return instituteService.createInstitute(request);
    }

    @GetMapping
    public List<InstituteResponse> getAllInstitutes() {
        return instituteService.getAllInstitutes();
    }

    @GetMapping("/{id}")
    public Institute getInstituteById(@PathVariable Long id) {
        return instituteService.getInstituteById(id);
    }

    @PatchMapping("/{id}/status")
    public InstituteResponse updateStatus(@PathVariable Long id, @RequestParam Institute.InstituteStatus status) {
        return instituteService.updateInstituteStatus(id, status);
    }
}