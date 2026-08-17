package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<AuditLog> findByInstituteIdOrderByCreatedAtDesc(Long instituteId);
    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);
}