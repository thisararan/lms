package com.lms.service;

import com.lms.dto.NoteDto;

import java.util.List;

public interface NoteService {
    List<NoteDto> getAccessibleNotes();
    // Other methods (e.g., createNote, updateNote, deleteNote)
}