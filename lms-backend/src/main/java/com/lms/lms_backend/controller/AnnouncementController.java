package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.Announcement;
import com.lms.lms_backend.service.NotificationService;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    @PreAuthorize("hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN') or hasRole('LECTURER')")
    public Announcement createAnnouncement(@RequestBody Announcement announcement) {
        // Set institute context if not provided
        if (announcement.getInstituteId() == null) {
            Long currentInst = TenantContext.getInstituteId();
            // Allow null only for System Admin global announcements
        }
        return notificationService.createAnnouncement(announcement);
    }

    @GetMapping("/institute")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN')")
    public List<Announcement> getInstituteAnnouncements() {
        Long instituteId = TenantContext.getInstituteId();
        return notificationService.getAnnouncementsForInstitute(instituteId);
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('INSTITUTE_ADMIN') or hasRole('LECTURER') or hasRole('STUDENT')")
    public List<Announcement> getCourseAnnouncements(@PathVariable Long courseId) {
        return notificationService.getAnnouncementsForCourse(courseId);
    }

    @GetMapping("/global")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<Announcement> getGlobalAnnouncements() {
        return notificationService.getAnnouncementsForInstitute(null);
    }
}