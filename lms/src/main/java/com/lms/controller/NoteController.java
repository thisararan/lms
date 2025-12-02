package com.lms.controller;

import com.lms.dto.NoteDto;
import com.lms.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * Controller for managing note-related endpoints.
 */
@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    /**
     * Retrieves all accessible notes for the authenticated user.
     *
     * @return A ResponseEntity with the list of accessible notes or an error.
     */
    @GetMapping("/accessible")
    public ResponseEntity<List<NoteDto>> getAccessibleNotes() {
        try {
            List<NoteDto> notes = noteService.getAccessibleNotes();
            return ResponseEntity.ok(notes != null ? notes : Collections.emptyList());
        } catch (SecurityException e) {
            System.err.println("SecurityException in getAccessibleNotes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null); // Consider adding a custom error response DTO if needed
        } catch (RuntimeException e) {
            System.err.println("RuntimeException in getAccessibleNotes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    // Other note-related endpoints (e.g., create, update, delete) can be added here
}