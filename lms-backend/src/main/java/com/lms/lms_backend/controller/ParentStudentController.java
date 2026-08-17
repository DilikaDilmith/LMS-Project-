package com.lms.lms_backend.controller;

import com.lms.lms_backend.annotation.Auditable;
import com.lms.lms_backend.model.ParentStudent;
import com.lms.lms_backend.model.User;
import com.lms.lms_backend.repository.ParentStudentRepository;
import com.lms.lms_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/parent")
public class ParentStudentController {

    @Autowired
    private ParentStudentRepository parentStudentRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. Link Parent to Student
    @PostMapping("/student")
    @Auditable(action = "LINK_CHILD", description = "Parent links a child account")
    public ParentStudent linkParentToStudent(
            @RequestParam Long parentId,
            @RequestParam Long studentId) {

        // Validate Student exists
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found!"));

        // Check if already linked
        if (parentStudentRepository.existsByParentIdAndStudentId(parentId, studentId)) {
            throw new RuntimeException("Child is already linked to your account!");
        }

        ParentStudent link = new ParentStudent();
        link.setParentId(parentId);
        link.setStudentId(studentId);

        return parentStudentRepository.save(link);
    }

    // 2. Get Linked Children for Parent
    @GetMapping("/children/{parentId}")
    public List<User> getChildrenByParent(@PathVariable Long parentId) {
        List<ParentStudent> links = parentStudentRepository.findByParentId(parentId);
        List<User> children = new ArrayList<>();
        for (ParentStudent link : links) {
            User child = userRepository.findById(link.getStudentId()).orElse(null);
            if (child != null) {
                children.add(child);
            }
        }
        return children;
    }
}
