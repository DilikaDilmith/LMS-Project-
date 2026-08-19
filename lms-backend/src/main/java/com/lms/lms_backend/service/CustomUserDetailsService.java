package com.lms.lms_backend.service;

import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String status = user.getStatus();

        if (status == null || status.isBlank() || "PENDING".equalsIgnoreCase(status)) {
            throw new DisabledException("PENDING: Your account is not active yet. Please contact your Institute Admin.");
        }
        if ("REJECTED".equalsIgnoreCase(status)) {
            throw new DisabledException("REJECTED: Your registration was rejected. Please contact your Institute Admin.");
        }
        if ("INACTIVE".equalsIgnoreCase(status) || "SUSPENDED".equalsIgnoreCase(status)) {
            throw new DisabledException("Your account is inactive. Please contact your Institute Admin.");
        }

        if (!"ACTIVE".equalsIgnoreCase(status)) {
            throw new DisabledException("Your account is not active. Please contact your Institute Admin.");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
