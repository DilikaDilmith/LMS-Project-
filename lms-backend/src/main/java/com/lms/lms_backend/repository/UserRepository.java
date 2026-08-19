package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Role;
import com.lms.lms_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByInstituteId(Long instituteId);
    List<User> findByInstituteIdAndRole(Long instituteId, Role role);
    List<User> findByStatusIgnoreCase(String status);
    List<User> findByInstituteIdAndStatusIgnoreCase(Long instituteId, String status);
}