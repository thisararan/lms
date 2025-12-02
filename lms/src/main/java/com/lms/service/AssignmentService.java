package com.lms.service;

import com.lms.dto.AssignmentDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AssignmentService {
    AssignmentDto createAssignment(AssignmentDto assignmentDto, MultipartFile file);
    AssignmentDto updateAssignment(Long id, AssignmentDto assignmentDto, MultipartFile file);
    void deleteAssignment(Long id);
    List<AssignmentDto> getAssignmentsByCourse(Long courseId);
    AssignmentDto getAssignmentById(Long id);
    List<AssignmentDto> getAllAssignments();
}
