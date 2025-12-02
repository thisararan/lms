// src/main/java/com/lms/service/SubmissionService.java

package com.lms.service;

import com.lms.dto.SubmissionDto;
import com.lms.entity.Assignment;
import com.lms.entity.Submission;
import com.lms.entity.User;
import com.lms.repository.AssignmentRepository;
import com.lms.repository.SubmissionRepository;
import com.lms.repository.UserRepository;
import com.lms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final EnrollmentService enrollmentService;

    private final String UPLOAD_DIR = "uploads/submissions/";

    // 1. Student submits assignment
    public SubmissionDto submitAssignment(Long assignmentId, String content, MultipartFile file) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() != User.Role.STUDENT) {
            throw new SecurityException("Only students can submit assignments");
        }

        if (!enrollmentService.isEnrolled(assignment.getCourse().getId())) {
            throw new SecurityException("You must be enrolled in the course to submit");
        }

        Submission submission = submissionRepository.findByAssignmentAndStudent(assignment, student)
                .orElse(new Submission());

        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setContent(content);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setGraded(false);

        if (file != null && !file.isEmpty()) {
            if (submission.getAttachmentUrl() != null) {
                deleteFile(submission.getAttachmentUrl());
            }
            String fileName = saveFile(file);
            submission.setAttachmentUrl("/uploads/submissions/" + fileName);
            submission.setAttachmentName(file.getOriginalFilename());
            submission.setAttachmentSize(file.getSize());
            submission.setAttachmentType(file.getContentType());
        }

        Submission saved = submissionRepository.save(submission);
        return convertToDto(saved);
    }

    // 2. Teacher grades a submission
    public SubmissionDto gradeSubmission(Long submissionId, Integer grade, String feedback) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User teacher = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (teacher.getRole() != User.Role.TEACHER && teacher.getRole() != User.Role.ADMIN) {
            throw new SecurityException("Only teachers or admins can grade submissions");
        }

        if (teacher.getRole() == User.Role.TEACHER &&
                !submission.getAssignment().getCourse().getInstructor().getId().equals(teacher.getId())) {
            throw new SecurityException("You can only grade submissions for your own courses");
        }

        submission.setGrade(grade);
        submission.setFeedback(feedback);
        submission.setGraded(true);
        submission.setGradedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(submission);
        return convertToDto(saved);
    }

    // 3. Get submissions by Assignment ID (Teacher view)
    public List<SubmissionDto> getSubmissionsByAssignment(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.TEACHER && user.getRole() != User.Role.ADMIN) {
            throw new SecurityException("Only teachers or admins can view submissions");
        }

        if (user.getRole() == User.Role.TEACHER &&
                !assignment.getCourse().getInstructor().getId().equals(user.getId())) {
            throw new SecurityException("You can only view submissions for your own courses");
        }

        return submissionRepository.findByAssignment(assignment).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 4. Student gets their own submissions
    public List<SubmissionDto> getMySubmissions() {
        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() != User.Role.STUDENT) {
            throw new SecurityException("Only students can view their submissions");
        }

        return submissionRepository.findByStudent(student).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 5. Get single submission by ID
    public SubmissionDto getSubmissionById(Long id) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found with id: " + id));
        return convertToDto(submission);
    }

    // 6. Check ownership (for security)
    public boolean isOwner(Long submissionId, String email) {
        return submissionRepository.findById(submissionId)
                .map(s -> s.getStudent().getEmail().equals(email))
                .orElse(false);
    }

    // 7. Teacher gets ALL submissions from their courses
    public List<SubmissionDto> getSubmissionsForTeacher() {
        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!currentUser.isTeacher() && !currentUser.isAdmin()) {
            throw new SecurityException("Only teachers can access this data");
        }

        List<Submission> submissions = submissionRepository.findByAssignment_Course_Instructor_Id(currentUser.getId());
        return submissions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // MOST IMPORTANT: Updated convertToDto() with course & assignment info
    private SubmissionDto convertToDto(Submission submission) {
        SubmissionDto dto = new SubmissionDto();
        dto.setId(submission.getId());
        dto.setAssignmentId(submission.getAssignment().getId());
        dto.setAssignmentTitle(submission.getAssignment().getTitle());           // NEW
        dto.setCourseId(submission.getAssignment().getCourse().getId());         // NEW
        dto.setCourseTitle(submission.getAssignment().getCourse().getTitle());   // NEW

        dto.setStudentId(submission.getStudent().getId());
        dto.setStudentName(submission.getStudent().getName());
        dto.setContent(submission.getContent());

        dto.setAttachmentUrl(submission.getAttachmentUrl());
        dto.setAttachmentName(submission.getAttachmentName());
        dto.setAttachmentSize(submission.getAttachmentSize());
        dto.setAttachmentType(submission.getAttachmentType());

        dto.setGraded(submission.getGraded());
        dto.setGrade(submission.getGrade());
        dto.setFeedback(submission.getFeedback());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setGradedAt(submission.getGradedAt());

        return dto;
    }

    // File handling
    private String saveFile(MultipartFile file) {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.write(path, file.getBytes());
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    private void deleteFile(String filePath) {
        try {
            if (filePath != null) {
                Path path = Paths.get("." + filePath);
                Files.deleteIfExists(path);
            }
        } catch (IOException e) {
            System.err.println("Failed to delete file: " + filePath);
        }
    }
}