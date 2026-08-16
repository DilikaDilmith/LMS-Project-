package com.lms.lms_backend.service;

import com.lms.lms_backend.model.Announcement;
import com.lms.lms_backend.model.Notification;
import com.lms.lms_backend.repository.AnnouncementRepository;
import com.lms.lms_backend.repository.NotificationRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    // -------- NOTIFICATIONS --------
    public Notification createNotification(Long userId, String title, String message, Notification.NotificationType type, String linkUrl) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type != null ? type : Notification.NotificationType.INFO);
        notification.setLinkUrl(linkUrl);
        notification.setIsRead(false);
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public Notification markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found!"));
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied!");
        }
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found!"));
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied!");
        }
        notificationRepository.delete(notification);
    }

    // -------- ANNOUNCEMENTS --------
    public Announcement createAnnouncement(Announcement announcement) {
        // Validate Institute Context
        Long currentInstituteId = TenantContext.getInstituteId();
        if (announcement.getInstituteId() == null && currentInstituteId != null) {
            // If global announcement, only System Admin can do. We'll let controller handle permissions.
        }
        return announcementRepository.save(announcement);
    }

    public List<Announcement> getAnnouncementsForInstitute(Long instituteId) {
        return announcementRepository.findByInstituteIdOrInstituteIdIsNullOrderByCreatedAtDesc(instituteId);
    }

    public List<Announcement> getAnnouncementsForCourse(Long courseId) {
        return announcementRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
    }
}