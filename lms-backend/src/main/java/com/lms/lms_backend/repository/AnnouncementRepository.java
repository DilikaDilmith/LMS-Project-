package com.lms.lms_backend.repository;

import com.lms.lms_backend.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByInstituteIdOrInstituteIdIsNullOrderByCreatedAtDesc(Long instituteId);
    List<Announcement> findByCourseIdOrderByCreatedAtDesc(Long courseId);
    List<Announcement> findByInstituteIdAndCourseIdIsNullOrderByCreatedAtDesc(Long instituteId);
}
