package com.lms.lms_backend.controller;

import com.lms.lms_backend.model.Notification;
import com.lms.lms_backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('PARENT') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<Notification> getUserNotifications(@PathVariable Long userId) {
        return notificationService.getUserNotifications(userId);
    }

    @GetMapping("/user/{userId}/unread")
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('PARENT') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public List<Notification> getUnreadNotifications(@PathVariable Long userId) {
        return notificationService.getUnreadNotifications(userId);
    }

    @GetMapping("/user/{userId}/unread/count")
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('PARENT') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public long getUnreadCount(@PathVariable Long userId) {
        return notificationService.getUnreadCount(userId);
    }

    @PutMapping("/{notificationId}/read/user/{userId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('PARENT') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public Notification markAsRead(@PathVariable Long notificationId, @PathVariable Long userId) {
        return notificationService.markAsRead(notificationId, userId);
    }

    @DeleteMapping("/{notificationId}/user/{userId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('LECTURER') or hasRole('PARENT') or hasRole('INSTITUTE_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public String deleteNotification(@PathVariable Long notificationId, @PathVariable Long userId) {
        notificationService.deleteNotification(notificationId, userId);
        return "Notification deleted!";
    }
}