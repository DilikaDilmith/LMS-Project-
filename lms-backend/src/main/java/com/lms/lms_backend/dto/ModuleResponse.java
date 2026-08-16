package com.lms.lms_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class ModuleResponse {
    private Long id;
    private String title;
    private String description;
    private Long courseId;
    private Integer orderIndex;
    private List<LessonResponse> lessons; // Lessons ගොඩක් තියෙන්න පුළුවන්
    private LocalDateTime createdAt;
}