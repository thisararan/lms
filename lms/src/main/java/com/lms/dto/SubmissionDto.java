// src/main/java/com/lms/dto/SubmissionDto.java

package com.lms.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDto {
    private Long id;

    private Long assignmentId;
    private String assignmentTitle;
    private Long courseId;
    private String courseTitle;

    private Long studentId;
    private String studentName;
    private String content;

    private String attachmentUrl;
    private String attachmentName;
    private Long attachmentSize;
    private String attachmentType;

    private Boolean graded;
    private Integer grade;
    private String feedback;

    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
}