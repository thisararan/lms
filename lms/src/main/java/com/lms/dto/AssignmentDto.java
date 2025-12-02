package com.lms.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.lms.entity.Assignment;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.time.LocalDateTime;

@Slf4j
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AssignmentDto {

    private Long id;

    @NotBlank(message = "Title is required")
    @JsonProperty("title")
    private String title;

    @NotBlank(message = "Description is required")
    @JsonProperty("description")
    private String description;

    @NotNull(message = "Due date is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    @JsonProperty("dueDate")
    private LocalDateTime dueDate;

    @NotNull(message = "Course ID is required")
    @JsonProperty("courseId")
    private Long courseId;

    @Min(value = 1, message = "Max points must be at least 1")
    @Max(value = 1000, message = "Max points must not exceed 1000")
    @JsonProperty("maxPoints")
    private Integer maxPoints = 100;

    // Response fields (not required for creation)
    private String courseName;
    private Long createdById;
    private String createdByName;
    private String attachmentUrl;
    private String attachmentName;
    private Long attachmentSize;
    private String attachmentType;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime createdAt;

    // Constructor for easy creation
    public AssignmentDto(String title, String description, LocalDateTime dueDate, Long courseId, Integer maxPoints) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.courseId = courseId;
        this.maxPoints = maxPoints != null ? maxPoints : 100;
    }

    public static AssignmentDto fromEntity(Assignment assignment) {
        try {
            if (assignment == null) {
                log.error("❌ Cannot convert null assignment to DTO");
                return null;
            }

            AssignmentDto dto = new AssignmentDto();
            dto.setId(assignment.getId());
            dto.setTitle(assignment.getTitle());
            dto.setDescription(assignment.getDescription());
            dto.setDueDate(assignment.getDueDate());
            dto.setMaxPoints(assignment.getMaxPoints());

            // Safe course handling
            if (assignment.getCourse() != null) {
                dto.setCourseId(assignment.getCourse().getId());
                dto.setCourseName(assignment.getCourse().getTitle());
            } else {
                log.warn("⚠️ Assignment {} has no course", assignment.getId());
            }

            // Safe creator handling
            if (assignment.getCreatedBy() != null) {
                dto.setCreatedById(assignment.getCreatedBy().getId());
                dto.setCreatedByName(assignment.getCreatedBy().getName());
            } else {
                log.warn("⚠️ Assignment {} has no creator", assignment.getId());
            }

            dto.setAttachmentUrl(assignment.getAttachmentUrl());
            dto.setAttachmentName(assignment.getAttachmentName());
            dto.setAttachmentSize(assignment.getAttachmentSize());
            dto.setAttachmentType(assignment.getAttachmentType());
            dto.setCreatedAt(assignment.getCreatedAt());

            log.debug("✅ Converted assignment entity to DTO: {}", dto.getTitle());
            return dto;

        } catch (Exception e) {
            log.error("❌ Error converting assignment to DTO: {}", e.getMessage(), e);
            return null;
        }
    }

    // Validation method
    public boolean isValid() {
        return title != null && !title.trim().isEmpty() &&
                description != null && !description.trim().isEmpty() &&
                dueDate != null &&
                courseId != null &&
                maxPoints != null && maxPoints >= 1 && maxPoints <= 1000;
    }

    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();

        if (title == null || title.trim().isEmpty()) {
            errors.append("Title is required. ");
        }

        if (description == null || description.trim().isEmpty()) {
            errors.append("Description is required. ");
        }

        if (dueDate == null) {
            errors.append("Due date is required. ");
        }

        if (courseId == null) {
            errors.append("Course ID is required. ");
        }

        if (maxPoints == null || maxPoints < 1 || maxPoints > 1000) {
            errors.append("Max points must be between 1 and 1000. ");
        }

        return errors.toString().trim();
    }
}