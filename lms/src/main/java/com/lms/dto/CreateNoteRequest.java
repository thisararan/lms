package com.lms.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.constraints.NotBlank;

@Data
public class CreateNoteRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private Long courseId;
    private String visibility = "ALL"; // Simple string - will be converted in service
    private MultipartFile attachment;
}