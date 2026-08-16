package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.LessonResponse;
import com.lms.lms_backend.dto.ModuleRequest;
import com.lms.lms_backend.dto.ModuleResponse;
import com.lms.lms_backend.model.Course;
import com.lms.lms_backend.model.Module;
import com.lms.lms_backend.repository.CourseRepository;
import com.lms.lms_backend.repository.LessonRepository;
import com.lms.lms_backend.repository.ModuleRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModuleService {

    @Autowired
    private ModuleRepository moduleRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private LessonService lessonService;

    // Module එක Create කරනවා
    public ModuleResponse createModule(ModuleRequest request) {
        // Course එක තියෙනවද සහ Institute Isolation check කරනවා
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied to this course!");
        }

        // Duplicate module name check
        if (moduleRepository.existsByCourseIdAndTitle(request.getCourseId(), request.getTitle())) {
            throw new RuntimeException("Module with this name already exists in this course!");
        }

        Module module = new Module();
        module.setTitle(request.getTitle());
        module.setDescription(request.getDescription());
        module.setCourseId(request.getCourseId());
        module.setOrderIndex(request.getOrderIndex());

        Module saved = moduleRepository.save(module);
        return mapToResponse(saved);
    }

    // Course එකක Modules List එක ගන්නවා (Lessons එක්ක)
    public List<ModuleResponse> getModulesByCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found!"));

        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied to this course!");
        }

        return moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Module එක මකන්න (Cascade - Lessonsත් මැකෙයි)
    @Transactional
    public void deleteModule(Long moduleId) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found!"));

        Course course = courseRepository.findById(module.getCourseId()).orElseThrow();
        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied!");
        }

        moduleRepository.delete(module);
    }

    // Helper
    private ModuleResponse mapToResponse(Module module) {
        List<LessonResponse> lessonResponses = lessonRepository.findByModuleIdOrderByOrderIndexAsc(module.getId())
                .stream()
                .map(lessonService::mapToResponse)
                .collect(Collectors.toList());

        return new ModuleResponse(
                module.getId(),
                module.getTitle(),
                module.getDescription(),
                module.getCourseId(),
                module.getOrderIndex(),
                lessonResponses,
                module.getCreatedAt()
        );
    }
}