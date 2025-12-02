package com.lms.service;

import com.lms.dto.NoteDto;
import com.lms.entity.Note;
import com.lms.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;

    @Override
    public List<NoteDto> getAccessibleNotes() {
        // Get the authenticated user's ID or role from SecurityContextHolder
        String userId = SecurityContextHolder.getContext().getAuthentication().getName(); // Adjust based on your security setup
        // Simulate enrollment check (replace with actual logic)
        // For now, allow access to all notes with visibility ALL or notes from enrolled courses
        return noteRepository.findAll()
                .stream()
                .filter(note -> note.getVisibility().equals(Note.Visibility.ALL) ||
                        (note.getCourse() != null && isUserEnrolledInCourse(note.getCourse().getId())))
                .map(NoteDto::fromEntity)
                .collect(Collectors.toList());
    }

    // Placeholder method to check enrollment (implement based on your enrollment service)
    private boolean isUserEnrolledInCourse(Long courseId) {
        // Implement logic to check if the user is enrolled in the course
        // Example: Use an EnrollmentRepository or EnrollmentService
        // For now, return true as a placeholder
        return true; // Replace with actual enrollment check
    }

    // Other methods (e.g., createNote, updateNote, deleteNote)
}