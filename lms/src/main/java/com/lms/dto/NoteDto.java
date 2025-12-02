package com.lms.dto;

import com.lms.entity.Note;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Data
public class NoteDto {
    private Long id;

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private Long courseId;
    private String courseTitle;
    private Long authorId;
    private String authorName;
    private Note.Visibility visibility;
    private String attachmentUrl;
    private String attachmentName;
    private Long attachmentSize;
    private String attachmentType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoteDto fromEntity(Note note) {
        NoteDto dto = new NoteDto();
        dto.setId(note.getId());
        dto.setTitle(note.getTitle());
        dto.setContent(note.getContent());
        dto.setCourseId(note.getCourse() != null ? note.getCourse().getId() : null);
        dto.setCourseTitle(note.getCourse() != null ? note.getCourse().getTitle() : "General");
        dto.setAuthorId(note.getAuthor().getId());
        dto.setAuthorName(note.getAuthor().getName());
        dto.setVisibility(note.getVisibility());
        dto.setAttachmentUrl(note.getAttachmentUrl());
        dto.setAttachmentName(note.getAttachmentName());
        dto.setAttachmentSize(note.getAttachmentSize());
        dto.setAttachmentType(note.getAttachmentType());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setUpdatedAt(note.getUpdatedAt());
        return dto;
    }
}