package com.lms.lms_backend.controller;

import com.lms.lms_backend.dto.AuthRequest;
import com.lms.lms_backend.dto.AuthResponse;
import com.lms.lms_backend.dto.RegisterRequest;
import com.lms.lms_backend.model.Institute;
import com.lms.lms_backend.model.Role;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.InstituteRepository;
import com.lms.lms_backend.repository.UserRepository;
import com.lms.lms_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.lms.lms_backend.dto.InstituteResponse;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InstituteRepository instituteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    @GetMapping("/institutes")
    public List<InstituteResponse> getPublicInstitutes() {
        return instituteRepository.findAll().stream()
                .filter(i -> i.getStatus() != null &&
                        i.getStatus() != Institute.InstituteStatus.SUSPENDED &&
                        i.getStatus() != Institute.InstituteStatus.EXPIRED)
                .map(institute -> new InstituteResponse(
                        institute.getId(),
                        institute.getName(),
                        institute.getEmail(),
                        institute.getPhone(),
                        institute.getAddress(),
                        institute.getStatus(),
                        institute.getSubscriptionPlan(),
                        institute.getSubscriptionEndDate()
                ))
                .collect(Collectors.toList());
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return "Error: Username is taken!";
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return "Error: Email is in use!";
        }

        Role role = request.getRole();
        if (role == null || role == Role.ROLE_SYSTEM_ADMIN) {
            return "Error: Invalid role selected for registration.";
        }

        Long targetInstituteId = (request.getInstituteId() != null && request.getInstituteId() > 0) 
                ? request.getInstituteId() 
                : 1L;

        Institute institute = instituteRepository.findById(targetInstituteId).orElse(null);
        if (institute != null && (institute.getStatus() == Institute.InstituteStatus.SUSPENDED || institute.getStatus() == Institute.InstituteStatus.EXPIRED)) {
            return "Error: Selected institute is suspended or expired. Please contact support.";
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setInstituteId(targetInstituteId);
        user.setStatus("PENDING");

        userRepository.save(user);
        return "Registration submitted! Awaiting Institute Admin approval.";
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();

        String token = jwtUtil.generateToken(userDetails.getUsername(), user.getInstituteId());

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getRole().name(), user.getInstituteId());
    }
}
