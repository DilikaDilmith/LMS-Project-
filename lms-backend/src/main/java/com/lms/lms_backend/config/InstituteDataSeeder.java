package com.lms.lms_backend.config;

import com.lms.lms_backend.model.Institute;
import com.lms.lms_backend.repository.InstituteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class InstituteDataSeeder {

    @Bean
    CommandLineRunner seedInstitutes(InstituteRepository instituteRepository) {
        return args -> {
            seedInstitute(
                    instituteRepository,
                    "Greenwood Academy",
                    "GA-2026-001",
                    "greenwood@lms.local"
            );
            seedInstitute(
                    instituteRepository,
                    "Sunrise College",
                    "SC-2026-002",
                    "sunrise@lms.local"
            );
        };
    }

    private void seedInstitute(
            InstituteRepository repository,
            String name,
            String registrationNumber,
            String email
    ) {
        if (repository.existsByName(name)) {
            return;
        }

        Institute institute = new Institute();
        institute.setName(name);
        institute.setRegistrationNumber(registrationNumber);
        institute.setEmail(email);
        institute.setPhone("+94 11 234 5678");
        institute.setAddress("Colombo, Sri Lanka");
        institute.setStatus(Institute.InstituteStatus.ACTIVE);
        institute.setSubscriptionPlan(Institute.SubscriptionPlan.BASIC);
        institute.setSubscriptionStartDate(LocalDateTime.now());
        institute.setSubscriptionEndDate(LocalDateTime.now().plusYears(1));
        repository.save(institute);
    }
}
