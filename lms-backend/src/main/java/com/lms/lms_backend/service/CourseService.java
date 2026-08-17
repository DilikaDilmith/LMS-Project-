package com.lms.lms_backend.service;

import com.lms.lms_backend.dto.CourseRequest;
import com.lms.lms_backend.dto.CourseResponse;
import com.lms.lms_backend.model.Course;
import com.lms.lms_backend.model.Enrollment;
import com.lms.lms_backend.model.Role;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.CourseRepository;
import com.lms.lms_backend.repository.EnrollmentRepository;
import com.lms.lms_backend.repository.UserRepository;
import com.lms.lms_backend.util.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;   // 👈 මෙතන Add කරන්න

    // Lecturer විසින් Course එකක් Create කරනවා (DRAFT status)
    public CourseResponse createCourse(CourseRequest request) {
        // 1. Lecturer එක තියෙනවද check කරනවා
        User lecturer = userRepository.findById(request.getLecturerId())
                .orElseThrow(() -> new RuntimeException("Lecturer not found!"));

        // Role එක check කරනවා (අපි Role enum එක use කරනවා)
        if (lecturer.getRole() != Role.ROLE_LECTURER) {
            throw new RuntimeException("User is not a Lecturer!");
        }

        // Resolve instituteId if missing
        if (request.getInstituteId() == null) {
            request.setInstituteId(lecturer.getInstituteId() != null ? lecturer.getInstituteId() : TenantContext.getInstituteId());
        }
        if (request.getInstituteId() == null) {
            request.setInstituteId(1L);
        }

        // 2. Institute Isolation: ලෙක්චරර්ලා ඉන්නේ එකම Institute එකේද?
        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(request.getInstituteId())) {
            throw new RuntimeException("You can only create courses for your own institute!");
        }

        // 3. Course name එක duplicateද check කරනවා
        if (courseRepository.existsByNameAndInstituteId(request.getName(), request.getInstituteId())) {
            throw new RuntimeException("Course with this name already exists in your institute!");
        }


        // 4. Course එක Save කරනවා
        Course course = new Course();
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setDurationWeeks(request.getDurationWeeks());
        course.setInstituteId(request.getInstituteId());
        course.setLecturerId(request.getLecturerId());
        course.setStatus(Course.CourseStatus.DRAFT);

        Course saved = courseRepository.save(course);
        return mapToResponse(saved);
    }

    // Course එක Pending Approval status එකට Submit කරනවා
    public CourseResponse submitForApproval(Long courseId) {
        Course course = getCourseById(courseId);
        validateLecturerAccess(course);

        if (course.getStatus() == Course.CourseStatus.DRAFT) {
            course.setStatus(Course.CourseStatus.PENDING_APPROVAL);
        } else {
            throw new RuntimeException("Only DRAFT courses can be submitted for approval!");
        }

        return mapToResponse(courseRepository.save(course));
    }

    // Institute Admin විසින් Course එක Approve කරනවා
    public CourseResponse approveCourse(Long courseId) {
        Course course = getCourseById(courseId);
        validateInstituteAdminAccess(course);

        if (course.getStatus() == Course.CourseStatus.PENDING_APPROVAL) {
            course.setStatus(Course.CourseStatus.APPROVED);
        } else {
            throw new RuntimeException("Only PENDING_APPROVAL courses can be approved!");
        }

        return mapToResponse(courseRepository.save(course));
    }

    // Institute Admin විසින් Course එක Reject කරනවා
    public CourseResponse rejectCourse(Long courseId, String reason) {
        Course course = getCourseById(courseId);
        validateInstituteAdminAccess(course);

        if (course.getStatus() == Course.CourseStatus.PENDING_APPROVAL) {
            course.setStatus(Course.CourseStatus.REJECTED);
            course.setRejectionReason(reason);
        } else {
            throw new RuntimeException("Only PENDING_APPROVAL courses can be rejected!");
        }

        return mapToResponse(courseRepository.save(course));
    }

    // Institute එකක තියෙන හැම Course එකම ගන්නවා (Institute Admin/Student)
    public List<CourseResponse> getCoursesByInstitute(Long instituteId) {
        if (instituteId == null || instituteId == 0) {
            return courseRepository.findAll()
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return courseRepository.findByInstituteId(instituteId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Approved Courses විතරක් ගන්නවා (Studentsට පෙන්වන්න)
    public List<CourseResponse> getApprovedCoursesByInstitute(Long instituteId) {
        if (instituteId == null || instituteId == 0) {
            return courseRepository.findByStatus(Course.CourseStatus.APPROVED)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return courseRepository.findByInstituteIdAndStatus(instituteId, Course.CourseStatus.APPROVED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Lecturer කෙනෙක් හදපු හැම Course එකම ගන්නවා
    public List<CourseResponse> getCoursesByLecturer(Long lecturerId) {
        return courseRepository.findByLecturerId(lecturerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // 👇 NEW: Student ගේ Enrolled Courses List එක
    public List<CourseResponse> getStudentEnrolledCourses(Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        List<CourseResponse> enrolledCourses = new ArrayList<>();
        for (Enrollment enrollment : enrollments) {
            Course course = courseRepository.findById(enrollment.getCourseId()).orElse(null);
            if (course != null && course.getStatus() == Course.CourseStatus.APPROVED) {
                enrolledCourses.add(mapToResponse(course));
            }
        }
        return enrolledCourses;
    }

    // ID එකෙන් Course එක ගන්නවා
    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found!"));
    }

    public CourseResponse getCourseResponseById(Long id) {
        Course course = getCourseById(id);
        return mapToResponse(course);
    }

    // Helper methods
    private void validateLecturerAccess(Course course) {
        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId != null && !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied! This course does not belong to your institute.");
        }
    }

    private void validateInstituteAdminAccess(Course course) {
        Long currentInstituteId = TenantContext.getInstituteId();
        if (currentInstituteId == null || !currentInstituteId.equals(course.getInstituteId())) {
            throw new RuntimeException("Access denied! You can only manage courses in your institute.");
        }
    }

    private CourseResponse mapToResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getThumbnailUrl(),
                course.getDurationWeeks(),
                course.getInstituteId(),
                course.getLecturerId(),
                course.getStatus(),
                course.getRejectionReason(),
                course.getCreatedAt()
        );
    }
}