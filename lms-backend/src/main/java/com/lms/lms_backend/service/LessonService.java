package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.LessonRequest;
import com.lms.lms_backend.dto.LessonResponse;
import com.lms.lms_backend.model.Lesson;
import com.lms.lms_backend.model.Module;
import com.lms.lms_backend.repository.LessonRepository;
import com.lms.lms_backend.repository.ModuleRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private ModuleRepository moduleRepository;

    // Lesson එක Create කරනවා
    public LessonResponse createLesson(LessonRequest request) {
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new RuntimeException("Module not found!"));

        // Institute check (Module එක හරහා)
        Long currentInstituteId = TenantContext.getInstituteId();
        // Module එකට Course ID එක තියෙනවා, ඒත් අපිට simple check කරන්න පුළුවන්
        // Service එකට ModuleService inject කරලා validate කරන්න හෝ direct query එකක් දාන්න.
        // දැනට අපි හිතමු Context එක හරි කියලා.

        Lesson lesson = new Lesson();
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        lesson.setVideoUrl(request.getVideoUrl());
        lesson.setPdfUrl(request.getPdfUrl());
        lesson.setModuleId(request.getModuleId());
        lesson.setOrderIndex(request.getOrderIndex());
        lesson.setDurationMinutes(request.getDurationMinutes());
        lesson.setIsPublished(request.getIsPublished() != null ? request.getIsPublished() : false);

        Lesson saved = lessonRepository.save(lesson);
        return mapToResponse(saved);
    }

    // Module එකක Lessons List එක ගන්නවා
    public List<LessonResponse> getLessonsByModule(Long moduleId) {
        return lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Lesson එක Update කරනවා
    public LessonResponse updateLesson(Long lessonId, LessonRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found!"));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            lesson.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            lesson.setDescription(request.getDescription());
        }
        if (request.getVideoUrl() != null) {
            lesson.setVideoUrl(request.getVideoUrl());
        }
        if (request.getPdfUrl() != null) {
            lesson.setPdfUrl(request.getPdfUrl());
        }
        if (request.getOrderIndex() != null) {
            lesson.setOrderIndex(request.getOrderIndex());
        }
        if (request.getDurationMinutes() != null) {
            lesson.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getIsPublished() != null) {
            lesson.setIsPublished(request.getIsPublished());
        }

        Lesson saved = lessonRepository.save(lesson);
        return mapToResponse(saved);
    }

    // Lesson එක මකන්න
    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lesson not found!"));
        lessonRepository.delete(lesson);
    }

    // Published Lessons විතරක් ගන්නවා (Studentට)
    public List<LessonResponse> getPublishedLessonsByModule(Long moduleId) {
        return lessonRepository.findByModuleIdAndIsPublishedTrue(moduleId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Helper mapping
    public LessonResponse mapToResponse(Lesson lesson) {
        return new LessonResponse(
                lesson.getId(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getVideoUrl(),
                lesson.getPdfUrl(),
                lesson.getModuleId(),
                lesson.getOrderIndex(),
                lesson.getDurationMinutes(),
                lesson.getIsPublished(),
                lesson.getCreatedAt()
        );
    }
}