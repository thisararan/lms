package com.lms.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EnrollmentDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long courseId;
    private String courseTitle;
    private String courseDescription;
    private String instructorName;
    private Integer progress;
    private Boolean completed;
    private LocalDateTime enrolledAt;

    // Additional fields for better frontend display
    private String courseCategory;
    private String courseLevel; // This is now String (converted from enum)
    private String courseImageUrl;
    private String courseDuration; // Changed to String to match Course entity
    private Double courseRating;
    private String coursePrice; // Added to match Course entity

    // Helper method to get display name for level
    public String getCourseLevelDisplay() {
        if (courseLevel == null) return "Beginner";

        switch (courseLevel.toUpperCase()) {
            case "BEGINNER":
                return "Beginner";
            case "INTERMEDIATE":
                return "Intermediate";
            case "ADVANCED":
                return "Advanced";
            default:
                return courseLevel;
        }
    }

    // Helper method to get progress percentage for display
    public String getProgressPercentage() {
        return progress + "%";
    }

    // Helper method to check if course is completed
    public boolean isCourseCompleted() {
        return completed != null && completed;
    }

    // Helper method to get status badge
    public String getStatusBadge() {
        if (isCourseCompleted()) {
            return "Completed";
        } else if (progress > 0) {
            return "In Progress";
        } else {
            return "Not Started";
        }
    }
}