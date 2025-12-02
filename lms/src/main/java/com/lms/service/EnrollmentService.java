package com.lms.service;

import com.lms.dto.EnrollmentDto;
import com.lms.entity.Course;
import com.lms.entity.Enrollment;
import com.lms.entity.User;
import com.lms.repository.CourseRepository;
import com.lms.repository.EnrollmentRepository;
import com.lms.repository.UserRepository;
import com.lms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class for managing enrollment operations.
 */
@Service
@RequiredArgsConstructor
public class EnrollmentService implements EnrollmentServiceTmp {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    /**
     * Enrolls a student in a course.
     *
     * @param courseId The ID of the course to enroll in.
     * @return The created EnrollmentDto.
     * @throws RuntimeException If the student or course is not found, or if already enrolled.
     */
    @Transactional
    public EnrollmentDto enrollInCourse(Long courseId) {
        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new RuntimeException("Already enrolled in this course");
        }

        Enrollment enrollment = new Enrollment(student, course);
        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        // Update course student count
        course.setStudents(course.getStudents() != null ? course.getStudents() + 1 : 1);
        courseRepository.save(course);

        return convertToDto(savedEnrollment);
    }

    /**
     * Retrieves all enrollments for the current student.
     *
     * @return A list of EnrollmentDto objects.
     * @throws RuntimeException If the student is not found.
     */
    public List<EnrollmentDto> getMyEnrollments() {
        UserPrincipal currentUser = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User student = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return enrollmentRepository.findByStudent(student).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all enrollments for a specific course.
     *
     * @param courseId The ID of the course.
     * @return A list of EnrollmentDto objects.
     * @throws RuntimeException If the course is not found.
     */
    public List<EnrollmentDto> getCourseEnrollments(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        return enrollmentRepository.findByCourse(course).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Checks if the current user is enrolled in a specific course.
     *
     * @param courseId The ID of the course.
     * @return True if enrolled, false otherwise.
     */
    public boolean isEnrolled(Long courseId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserPrincipal) {
            User currentUser = userRepository.findById(((UserPrincipal) principal).getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            if (currentUser.getRole() == User.Role.STUDENT) {
                Course course = courseRepository.findById(courseId)
                        .orElseThrow(() -> new RuntimeException("Course not found"));
                return enrollmentRepository.existsByStudentAndCourse(currentUser, course);
            }
        }
        // For non-students (e.g., teachers/admins), allow access
        return true;
    }

    /**
     * Get enrolled course IDs for a student
     *
     * @param studentId The ID of the student
     * @return List of course IDs the student is enrolled in
     */
    @Override
    public List<Long> getEnrolledCourseIds(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);
        return enrollments.stream()
                .map(enrollment -> enrollment.getCourse().getId())
                .collect(Collectors.toList());
    }

    /**
     * Update enrollment progress
     *
     * @param enrollmentId The ID of the enrollment
     * @param progress The new progress value (0-100)
     * @return Updated EnrollmentDto
     */
    @Transactional
    public EnrollmentDto updateProgress(Long enrollmentId, Integer progress) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));

        if (progress < 0 || progress > 100) {
            throw new RuntimeException("Progress must be between 0 and 100");
        }

        enrollment.setProgress(progress);

        // Mark as completed if progress is 100%
        if (progress == 100) {
            enrollment.setCompleted(true);
        }

        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return convertToDto(updatedEnrollment);
    }

    /**
     * Mark enrollment as completed
     *
     * @param enrollmentId The ID of the enrollment
     * @return Updated EnrollmentDto
     */
    @Transactional
    public EnrollmentDto markAsCompleted(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));

        enrollment.setProgress(100);
        enrollment.setCompleted(true);

        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return convertToDto(updatedEnrollment);
    }

    /**
     * Unenroll student from course
     *
     * @param enrollmentId The ID of the enrollment to delete
     */
    @Transactional
    public void unenroll(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found with id: " + enrollmentId));

        // Update course student count
        Course course = enrollment.getCourse();
        if (course.getStudents() != null && course.getStudents() > 0) {
            course.setStudents(course.getStudents() - 1);
            courseRepository.save(course);
        }

        enrollmentRepository.delete(enrollment);
    }

    /**
     * Get enrollment statistics for a student
     *
     * @param studentId The ID of the student
     * @return Object containing enrollment statistics
     */
    public EnrollmentStats getEnrollmentStats(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));

        List<Enrollment> enrollments = enrollmentRepository.findByStudent(student);

        long totalEnrollments = enrollments.size();
        long completedCourses = enrollments.stream()
                .filter(Enrollment::getCompleted)
                .count();
        long inProgressCourses = enrollments.stream()
                .filter(enrollment -> !enrollment.getCompleted() && enrollment.getProgress() > 0)
                .count();
        long notStartedCourses = enrollments.stream()
                .filter(enrollment -> !enrollment.getCompleted() && enrollment.getProgress() == 0)
                .count();

        double averageProgress = enrollments.stream()
                .mapToInt(Enrollment::getProgress)
                .average()
                .orElse(0.0);

        return new EnrollmentStats(
                totalEnrollments,
                completedCourses,
                inProgressCourses,
                notStartedCourses,
                Math.round(averageProgress * 100.0) / 100.0
        );
    }

    /**
     * Converts an Enrollment entity to a DTO.
     *
     * @param enrollment The enrollment entity.
     * @return The corresponding EnrollmentDto.
     */
    private EnrollmentDto convertToDto(Enrollment enrollment) {
        EnrollmentDto dto = new EnrollmentDto();
        dto.setId(enrollment.getId());
        dto.setStudentId(enrollment.getStudent().getId());
        dto.setStudentName(enrollment.getStudent().getName());
        dto.setStudentEmail(enrollment.getStudent().getEmail());
        dto.setCourseId(enrollment.getCourse().getId());
        dto.setCourseTitle(enrollment.getCourse().getTitle());
        dto.setCourseDescription(enrollment.getCourse().getDescription());
        dto.setProgress(enrollment.getProgress());
        dto.setCompleted(enrollment.getCompleted());
        dto.setEnrolledAt(enrollment.getEnrolledAt());

        // Set additional course details
        Course course = enrollment.getCourse();
        if (course.getInstructor() != null) {
            dto.setInstructorName(course.getInstructor().getName());
        }
        dto.setCourseCategory(course.getCategory());

        // FIXED: Convert Course.Level enum to String using name() method
        if (course.getLevel() != null) {
            dto.setCourseLevel(course.getLevel().name()); // Convert enum to string
        } else {
            dto.setCourseLevel("BEGINNER"); // Default value
        }

        dto.setCourseImageUrl(course.getImageUrl());
        dto.setCourseDuration(course.getDuration()); // This is String in your Course entity
        dto.setCourseRating(course.getRating());
        dto.setCoursePrice(course.getPrice()); // This is String in your Course entity

        return dto;
    }

    /**
     * Inner class for enrollment statistics
     */
    public static class EnrollmentStats {
        private final long totalCourses;
        private final long completed;
        private final long inProgress;
        private final long notStarted;
        private final double averageProgress;

        public EnrollmentStats(long totalCourses, long completed, long inProgress, long notStarted, double averageProgress) {
            this.totalCourses = totalCourses;
            this.completed = completed;
            this.inProgress = inProgress;
            this.notStarted = notStarted;
            this.averageProgress = averageProgress;
        }

        // Getters
        public long getTotalCourses() { return totalCourses; }
        public long getCompleted() { return completed; }
        public long getInProgress() { return inProgress; }
        public long getNotStarted() { return notStarted; }
        public double getAverageProgress() { return averageProgress; }
    }
}