// src/main/java/com/lms/controller/AssignmentController.java
package com.lms.controller;

import com.lms.dto.AssignmentDto;
import com.lms.service.AssignmentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin
public class AssignmentController {

    @Autowired
    private AssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<AssignmentDto> createAssignment(
            @RequestPart("data") AssignmentDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.ok(assignmentService.createAssignment(dto, file));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssignmentDto> updateAssignment(
            @PathVariable Long id,
            @RequestPart("data") AssignmentDto dto,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        return ResponseEntity.ok(assignmentService.updateAssignment(id, dto, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.ok("Deleted successfully");
    }

    @GetMapping
    public ResponseEntity<List<AssignmentDto>> getAll() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AssignmentDto>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByCourse(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id));
    }
}
