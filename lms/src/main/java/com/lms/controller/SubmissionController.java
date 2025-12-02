// src/main/java/com/lms/controller/SubmissionController.java
package com.lms.controller;

import com.lms.dto.SubmissionDto;
import com.lms.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubmissionController {

    private final SubmissionService submissionService;

    public static class ApiResponse {
        private final boolean success;
        private final String message;
        private final Object data;
        private final LocalDateTime timestamp = LocalDateTime.now();

        public ApiResponse(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }
        public ApiResponse(boolean success, String message) { this(success, message, null); }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public Object getData() { return data; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }

    // Student submits assignment
    @PostMapping(value = "/{assignmentId}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> submitAssignment(
            @PathVariable Long assignmentId,
            @RequestPart("content") String content,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            SubmissionDto dto = submissionService.submitAssignment(assignmentId, content, file);
            return ResponseEntity.ok(new ApiResponse(true, "Submitted successfully!", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Teacher grades submission
    @PutMapping("/{id}/grade")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> gradeSubmission(
            @PathVariable Long id,
            @RequestParam Integer grade,
            @RequestParam(required = false) String feedback) {
        try {
            SubmissionDto dto = submissionService.gradeSubmission(id, grade, feedback);
            return ResponseEntity.ok(new ApiResponse(true, "Graded successfully!", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // TEACHER: Get all submissions for a specific assignment ← මේක තමයි main fix
    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getSubmissionsByAssignment(@PathVariable Long assignmentId) {
        try {
            List<SubmissionDto> submissions = submissionService.getSubmissionsByAssignment(assignmentId);
            return ResponseEntity.ok(new ApiResponse(true, "Submissions loaded", submissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Student: Get my submissions
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> getMySubmissions() {
        try {
            List<SubmissionDto> subs = submissionService.getMySubmissions();
            return ResponseEntity.ok(new ApiResponse(true, "Your submissions", subs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    // Teacher: Get ALL submissions from ALL their courses
    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse> getTeacherSubmissions() {
        try {
            List<SubmissionDto> subs = submissionService.getSubmissionsForTeacher();
            return ResponseEntity.ok(new ApiResponse(true, "All your course submissions", subs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}