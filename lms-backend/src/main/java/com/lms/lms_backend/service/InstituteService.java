package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.InstituteRequest;
import com.lms.lms_backend.dto.InstituteResponse;
import com.lms.lms_backend.model.Institute;
import com.lms.lms_backend.repository.InstituteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InstituteService {

    @Autowired
    private InstituteRepository instituteRepository;

    public InstituteResponse createInstitute(InstituteRequest request) {
        if (instituteRepository.existsByName(request.getName())) {
            throw new RuntimeException("Institute with this name already exists!");
        }

        Institute institute = new Institute();
        institute.setName(request.getName());
        institute.setRegistrationNumber(request.getRegistrationNumber());
        institute.setEmail(request.getEmail());
        institute.setPhone(request.getPhone());
        institute.setAddress(request.getAddress());
        institute.setLogoUrl(request.getLogoUrl());
        institute.setSubscriptionPlan(request.getSubscriptionPlan());
        institute.setStatus(Institute.InstituteStatus.PENDING);
        institute.setSubscriptionStartDate(LocalDateTime.now());
        institute.setSubscriptionEndDate(LocalDateTime.now().plusMonths(1)); // මාස 1ක් trial

        Institute saved = instituteRepository.save(institute);
        return mapToResponse(saved);
    }

    public List<InstituteResponse> getAllInstitutes() {
        return instituteRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Institute getInstituteById(Long id) {
        return instituteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Institute not found!"));
    }

    public InstituteResponse updateInstituteStatus(Long id, Institute.InstituteStatus status) {
        Institute institute = getInstituteById(id);
        institute.setStatus(status);
        return mapToResponse(instituteRepository.save(institute));
    }

    private InstituteResponse mapToResponse(Institute institute) {
        return new InstituteResponse(
                institute.getId(),
                institute.getName(),
                institute.getEmail(),
                institute.getPhone(),
                institute.getAddress(),
                institute.getStatus(),
                institute.getSubscriptionPlan(),
                institute.getSubscriptionEndDate()
        );
    }
}