package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.model.Role;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // 1. Get Single User Profile
    @GetMapping("/{userId}")
    public User getUserProfile(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));
    }

    // 2. Update User Profile
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

    // 3. Get All Students (Optional filter by instituteId)
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

    // 4. Get Students by Institute ID (Handles 0 or null as fetch all students)
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

    // 5. Get Lecturers by Institute ID (Handles 0 or null as fetch all lecturers)
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
}

