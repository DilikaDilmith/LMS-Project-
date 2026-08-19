package com.lms.lms_backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class FileServingController {

    private static final Path UPLOAD_DIR = Paths.get("uploads").toAbsolutePath().normalize();

    @GetMapping("/uploads/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request) throws IOException {
        String requestPath = request.getRequestURI();
        String relativePath = requestPath.startsWith("/uploads/") ? requestPath.substring("/uploads/".length()) : requestPath;

        // Try resolving in uploads/
        Path filePath = UPLOAD_DIR.resolve(relativePath).normalize();

        if (!Files.exists(filePath)) {
            // Also check assignments subdirectory if direct filename given
            Path assignmentsPath = UPLOAD_DIR.resolve("assignments").resolve(relativePath).normalize();
            if (Files.exists(assignmentsPath)) {
                filePath = assignmentsPath;
            } else {
                return ResponseEntity.notFound().build();
            }
        }

        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) {
            String contentType = request.getServletContext().getMimeType(filePath.toString());
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filePath.getFileName().toString() + "\"")
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
