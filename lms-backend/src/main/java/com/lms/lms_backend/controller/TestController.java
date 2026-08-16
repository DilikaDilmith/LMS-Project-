package com.lms.lms_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/hello")
    public String sayHello() {
        return "LMS System එක හරියට වැඩ කරනවා! 🚀";
    }

    @GetMapping("/")
    public String home() {
        return "Welcome to LMS System! Login successful!";
    }
}