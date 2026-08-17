package com.lms.lms_backend.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.model.AuditLog;
import com.lms.lms_backend.repository.AuditLogRepository;
import com.lms.lms_backend.util.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
public class AuditLogAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Around("@annotation(auditable)")
    public Object logAudit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        String action = auditable.action();

        // 1. Get Current User
        Long userId = 0L;
        String username = "SYSTEM";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            username = auth.getName();
            if (auth.getPrincipal() instanceof UserDetails) {
                // Try to get user ID from database
                try {
                    // We'll use a service to fetch user by username
                    // For simplicity, we'll keep userId as 0 and store username
                } catch (Exception e) {
                    // Ignore
                }
            }
        }

        // 2. Get IP Address
        String ipAddress = "UNKNOWN";
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = request.getRemoteAddr();
                if (ipAddress == null || ipAddress.isEmpty() || "0:0:0:0:0:0:0:1".equals(ipAddress)) {
                    ipAddress = "127.0.0.1";
                }
            }
        } catch (Exception e) {
            // Ignore
        }

        // 3. Get Institute ID
        Long instituteId = TenantContext.getInstituteId();

        // 4. Get Method Arguments (Stringify to JSON)
        String details = "";
        try {
            Object[] args = joinPoint.getArgs();
            Map<String, Object> argsMap = new HashMap<>();
            for (int i = 0; i < args.length; i++) {
                if (args[i] != null && !(args[i] instanceof HttpServletRequest) && !(args[i] instanceof HttpServletResponse)) {
                    argsMap.put("arg" + i, args[i]);
                }
            }
            details = objectMapper.writeValueAsString(argsMap);
        } catch (Exception e) {
            details = "{\"error\":\"Could not serialize args\"}";
        }

        // 5. Execute Original Method
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setUsername(username);
        log.setInstituteId(instituteId);
        log.setAction(action);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        log.setCreatedAt(LocalDateTime.now());

        try {
            Object result = joinPoint.proceed();
            log.setStatus("SUCCESS");
            auditLogRepository.save(log);
            return result;
        } catch (Throwable throwable) {
            log.setStatus("FAILED");
            log.setErrorMessage(throwable.getMessage() != null ? throwable.getMessage().substring(0, Math.min(throwable.getMessage().length(), 2000)) : "Unknown error");
            auditLogRepository.save(log);
            throw throwable;
        }
    }
}