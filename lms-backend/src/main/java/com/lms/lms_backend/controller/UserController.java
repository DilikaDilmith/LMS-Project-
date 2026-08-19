package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.model.Role;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.UserRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public User getUserProfile(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    @PutMapping("/{userId}")
    @Auditable(action = "UPDATE_PROFILE", description = "User updates profile")
    public User updateProfile(@PathVariable Long userId, @RequestBody User request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getEmail() != null) user.setEmail(request.getEmail());

        return userRepository.save(user);
    }

    @GetMapping("/students")
    public List<User> getAllStudents() {
        try {
            return userRepository.findAll().stream()
                    .filter(u -> u != null && u.getRole() != null && u.getRole() == Role.ROLE_STUDENT)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/institute/{instituteId}/students")
    public List<User> getStudentsByInstitute(@PathVariable Long instituteId) {
        try {
            if (instituteId == null || instituteId == 0) {
                return getAllStudents();
            }
            List<User> list = userRepository.findByInstituteIdAndRole(instituteId, Role.ROLE_STUDENT);
            if (list == null || list.isEmpty()) {
                return getAllStudents();
            }
            return list;
        } catch (Exception e) {
            return getAllStudents();
        }
    }

    @GetMapping("/institute/{instituteId}/lecturers")
    public List<User> getLecturersByInstitute(@PathVariable Long instituteId) {
        try {
            if (instituteId == null || instituteId == 0) {
                return userRepository.findAll().stream()
                        .filter(u -> u != null && u.getRole() != null && u.getRole() == Role.ROLE_LECTURER)
                        .collect(Collectors.toList());
            }
            return userRepository.findByInstituteIdAndRole(instituteId, Role.ROLE_LECTURER);
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<User> getPendingUsers(Authentication authentication) {
        if (isSystemAdmin(authentication)) {
            return userRepository.findByStatusIgnoreCase("PENDING");
        }

        Long instituteId = TenantContext.getInstituteId();
        if (instituteId == null || instituteId == 0) {
            throw new org.springframework.security.access.AccessDeniedException("Institute context is required.");
        }

        return userRepository.findByInstituteIdAndStatusIgnoreCase(instituteId, "PENDING");
    }

    @GetMapping("/institute/{instituteId}/pending")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<User> getPendingUsersByInstitute(@PathVariable Long instituteId, Authentication authentication) {
        if (!isSystemAdmin(authentication)) {
            Long adminInstituteId = TenantContext.getInstituteId();
            if (adminInstituteId == null || !adminInstituteId.equals(instituteId)) {
                throw new org.springframework.security.access.AccessDeniedException("You can only view pending users from your institute.");
            }
        }

        return userRepository.findByInstituteIdAndStatusIgnoreCase(instituteId, "PENDING");
    }

    @PutMapping("/{userId}/approve")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "APPROVE_USER", description = "Admin approves pending user registration")
    public User approveUser(@PathVariable Long userId, Authentication authentication) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        assertCanManageUser(user, authentication);

        if (!"PENDING".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Only pending users can be approved.");
        }

        user.setStatus("ACTIVE");
        return userRepository.save(user);
    }

    @PutMapping("/{userId}/reject")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "REJECT_USER", description = "Admin rejects pending user registration")
    public User rejectUser(@PathVariable Long userId, Authentication authentication) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        assertCanManageUser(user, authentication);

        if (!"PENDING".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Only pending users can be rejected.");
        }

        user.setStatus("REJECTED");
        return userRepository.save(user);
    }

    @PutMapping("/{userId}/status")
    @PreAuthorize("hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    @Auditable(action = "UPDATE_USER_STATUS", description = "Admin updates user status")
    public User updateUserStatus(@PathVariable Long userId, @RequestParam String status, Authentication authentication) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        assertCanManageUser(user, authentication);

        user.setStatus(status);
        return userRepository.save(user);
    }

    private void assertCanManageUser(User targetUser, Authentication authentication) {
        if (authentication == null || isSystemAdmin(authentication)) {
            return;
        }

        Long adminInstituteId = TenantContext.getInstituteId();
        if (adminInstituteId == null || adminInstituteId == 0) {
            throw new org.springframework.security.access.AccessDeniedException("Institute context is required.");
        }

        if (targetUser.getInstituteId() == null || !adminInstituteId.equals(targetUser.getInstituteId())) {
            throw new org.springframework.security.access.AccessDeniedException("You can only manage users from your institute.");
        }
    }

    private boolean isSystemAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_SYSTEM_ADMIN"::equals);
    }
}
