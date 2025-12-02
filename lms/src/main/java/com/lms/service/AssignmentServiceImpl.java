package com.lms.service;

import com.lms.dto.AssignmentDto;
import com.lms.entity.Assignment;
import com.lms.entity.Course;
import com.lms.entity.User;
import com.lms.repository.AssignmentRepository;
import com.lms.repository.CourseRepository;
import com.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    // ---------------------------
    // CREATE ASSIGNMENT
    // ---------------------------
    @Override
    @Transactional
    public AssignmentDto createAssignment(AssignmentDto dto, MultipartFile file) {
        log.info("Creating new assignment: {}", dto.getTitle());

        Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User creator = userRepository.findById(1L) // Hard-coded until auth is added
                .orElseThrow(() -> new RuntimeException("User not found"));

        Assignment assignment = new Assignment();
        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setDueDate(dto.getDueDate());
        assignment.setCourse(course);
        assignment.setCreatedBy(creator);
        assignment.setMaxPoints(dto.getMaxPoints());
        assignment.setCreatedAt(LocalDateTime.now());

        // File handling
        if (file != null && !file.isEmpty()) {
            assignment.setAttachmentName(file.getOriginalFilename());
            assignment.setAttachmentType(file.getContentType());
            assignment.setAttachmentSize(file.getSize());
            assignment.setAttachmentUrl("/uploads/" + file.getOriginalFilename());
        }

        assignmentRepository.save(assignment);

        return AssignmentDto.fromEntity(assignment);
    }

    // ---------------------------
    // UPDATE ASSIGNMENT
    // ---------------------------
    @Override
    @Transactional
    public AssignmentDto updateAssignment(Long id, AssignmentDto dto, MultipartFile file) {
        log.info("Updating assignment {}", id);

        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        assignment.setTitle(dto.getTitle());
        assignment.setDescription(dto.getDescription());
        assignment.setDueDate(dto.getDueDate());
        assignment.setMaxPoints(dto.getMaxPoints());

        if (file != null && !file.isEmpty()) {
            assignment.setAttachmentName(file.getOriginalFilename());
            assignment.setAttachmentType(file.getContentType());
            assignment.setAttachmentSize(file.getSize());
            assignment.setAttachmentUrl("/uploads/" + file.getOriginalFilename());
        }

        assignmentRepository.save(assignment);

        return AssignmentDto.fromEntity(assignment);
    }

    // ---------------------------
    // DELETE ASSIGNMENT
    // ---------------------------
    @Override
    @Transactional
    public void deleteAssignment(Long id) {
        log.warn("Deleting assignment {}", id);
        assignmentRepository.deleteById(id);
    }

    // ---------------------------
    // GET ASSIGNMENTS BY COURSE
    // ---------------------------
    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDto> getAssignmentsByCourse(Long courseId) {
        log.info("Fetching assignments for course {}", courseId);

        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);

        return assignments.stream()
                .map(AssignmentDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ---------------------------
    // GET SINGLE ASSIGNMENT
    // ---------------------------
    @Override
    @Transactional(readOnly = true)
    public AssignmentDto getAssignmentById(Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        return AssignmentDto.fromEntity(assignment);
    }

    // ---------------------------
    // GET ALL ASSIGNMENTS
    // ---------------------------
    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDto> getAllAssignments() {
        log.info("Fetching all assignments");

        List<Assignment> assignments = assignmentRepository.findAll();

        return assignments.stream()
                .map(AssignmentDto::fromEntity)
                .collect(Collectors.toList());
    }
}
