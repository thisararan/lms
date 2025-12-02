package com.lms.controller;

import com.lms.dto.EnrollmentDto;
import com.lms.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing enrollment-related endpoints.
 */
@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * Enrolls the current student in a course.
     *
     * @param courseId The ID of the course.
     * @return A ResponseEntity with the enrollment details or an error.
     */
    @PostMapping("/course/{courseId}")
    public ResponseEntity<?> enrollInCourse(@PathVariable Long courseId) {
        try {
            EnrollmentDto enrollment = enrollmentService.enrollInCourse(courseId);
            return ResponseEntity.ok(new ApiResponse(true, "Successfully enrolled in course", enrollment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * Retrieves all enrollments for the current student.
     *
     * @return A ResponseEntity with the list of enrollments.
     */
    @GetMapping("/my-courses")
    public ResponseEntity<?> getMyEnrollments() {
        try {
            List<EnrollmentDto> enrollments = enrollmentService.getMyEnrollments();
            return ResponseEntity.ok(new ApiResponse(true, "Enrollments retrieved successfully", enrollments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve enrollments: " + e.getMessage()));
        }
    }

    /**
     * Retrieves all enrollments for a specific course.
     *
     * @param courseId The ID of the course.
     * @return A ResponseEntity with the list of enrollments.
     */
    @GetMapping("/course/{courseId}/students")
    public ResponseEntity<?> getCourseEnrollments(@PathVariable Long courseId) {
        try {
            List<EnrollmentDto> enrollments = enrollmentService.getCourseEnrollments(courseId);
            return ResponseEntity.ok(new ApiResponse(true, "Course enrollments retrieved successfully", enrollments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve course enrollments: " + e.getMessage()));
        }
    }

    /**
     * Get enrolled course IDs for current student
     *
     * @return A ResponseEntity with the list of course IDs
     */
    @GetMapping("/my-course-ids")
    public ResponseEntity<?> getMyEnrolledCourseIds() {
        try {
            // Get current student ID from security context
            Long studentId = getCurrentStudentId();
            List<Long> courseIds = enrollmentService.getEnrolledCourseIds(studentId);
            return ResponseEntity.ok(new ApiResponse(true, "Enrolled course IDs retrieved successfully", courseIds));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve enrolled course IDs: " + e.getMessage()));
        }
    }

    /**
     * Update enrollment progress
     *
     * @param enrollmentId The ID of the enrollment
     * @param progress The new progress value
     * @return A ResponseEntity with the updated enrollment
     */
    @PutMapping("/{enrollmentId}/progress")
    public ResponseEntity<?> updateProgress(@PathVariable Long enrollmentId, @RequestParam Integer progress) {
        try {
            EnrollmentDto enrollment = enrollmentService.updateProgress(enrollmentId, progress);
            return ResponseEntity.ok(new ApiResponse(true, "Progress updated successfully", enrollment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to update progress: " + e.getMessage()));
        }
    }

    /**
     * Mark enrollment as completed
     *
     * @param enrollmentId The ID of the enrollment
     * @return A ResponseEntity with the updated enrollment
     */
    @PutMapping("/{enrollmentId}/complete")
    public ResponseEntity<?> markAsCompleted(@PathVariable Long enrollmentId) {
        try {
            EnrollmentDto enrollment = enrollmentService.markAsCompleted(enrollmentId);
            return ResponseEntity.ok(new ApiResponse(true, "Course marked as completed", enrollment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to mark as completed: " + e.getMessage()));
        }
    }

    /**
     * Unenroll from a course
     *
     * @param enrollmentId The ID of the enrollment to delete
     * @return A ResponseEntity with success message
     */
    @DeleteMapping("/{enrollmentId}")
    public ResponseEntity<?> unenroll(@PathVariable Long enrollmentId) {
        try {
            enrollmentService.unenroll(enrollmentId);
            return ResponseEntity.ok(new ApiResponse(true, "Successfully unenrolled from course"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to unenroll: " + e.getMessage()));
        }
    }

    /**
     * Get enrollment statistics for current student
     *
     * @return A ResponseEntity with enrollment statistics
     */
    @GetMapping("/my-stats")
    public ResponseEntity<?> getMyEnrollmentStats() {
        try {
            // Get current student ID from security context
            Long studentId = getCurrentStudentId();
            EnrollmentService.EnrollmentStats stats = enrollmentService.getEnrollmentStats(studentId);
            return ResponseEntity.ok(new ApiResponse(true, "Enrollment statistics retrieved successfully", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to retrieve enrollment statistics: " + e.getMessage()));
        }
    }

    /**
     * Check if current student is enrolled in a course
     *
     * @param courseId The ID of the course to check
     * @return A ResponseEntity with boolean result
     */
    @GetMapping("/check/{courseId}")
    public ResponseEntity<?> checkEnrollment(@PathVariable Long courseId) {
        try {
            boolean isEnrolled = enrollmentService.isEnrolled(courseId);
            return ResponseEntity.ok(new ApiResponse(true, "Enrollment check completed", isEnrolled));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Failed to check enrollment: " + e.getMessage()));
        }
    }

    // Helper method to get current student ID (placeholder - implement based on your auth system)
    private Long getCurrentStudentId() {
        // This should be implemented to get the current authenticated user's ID
        // For now, return a placeholder - you'll need to integrate with your authentication
        // Example implementation:
        /*
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal) {
            return ((UserPrincipal) principal).getId();
        }
        throw new RuntimeException("User not authenticated");
        */
        return 1L; // Replace with actual user ID from security context
    }

    // API Response class
    public static class ApiResponse {
        private boolean success;
        private String message;
        private Object data;

        public ApiResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public ApiResponse(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }

        // Getters and setters
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
    }
}