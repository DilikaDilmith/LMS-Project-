package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Institute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InstituteRepository extends JpaRepository<Institute, Long> {
    Optional<Institute> findByName(String name);
    Optional<Institute> findByEmail(String email);
    boolean existsByName(String name);
    List<Institute> findAllByOrderBySubscriptionPlanAsc();
}