package com.lms.repository;

import com.lms.entity.Enrollment;
import com.lms.entity.Course;
import com.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing Enrollment entities.
 */
@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    /**
     * Finds an enrollment by student and course.
     *
     * @param student The student.
     * @param course The course.
     * @return An Optional containing the enrollment if found.
     */
    Optional<Enrollment> findByStudentAndCourse(User student, Course course);

    /**
     * Finds all enrollments for a given student.
     *
     * @param student The student.
     * @return A list of enrollments.
     */
    List<Enrollment> findByStudent(User student);

    /**
     * Finds all enrollments for a given course.
     *
     * @param course The course.
     * @return A list of enrollments.
     */
    List<Enrollment> findByCourse(Course course);

    /**
     * Checks if an enrollment exists for a student and course.
     *
     * @param student The student.
     * @param course The course.
     * @return True if the enrollment exists, false otherwise.
     */
    Boolean existsByStudentAndCourse(User student, Course course);

    /**
     * Counts the number of enrollments for a given course.
     *
     * @param course The course.
     * @return The number of enrollments.
     */
    Integer countByCourse(Course course);

    /**
     * Find enrollments by student ID
     *
     * @param studentId The ID of the student
     * @return List of enrollments for the student
     */
    @Query("SELECT e FROM Enrollment e WHERE e.student.id = :studentId")
    List<Enrollment> findByStudentId(@Param("studentId") Long studentId);

    /**
     * Find enrollments by course ID
     *
     * @param courseId The ID of the course
     * @return List of enrollments for the course
     */
    @Query("SELECT e FROM Enrollment e WHERE e.course.id = :courseId")
    List<Enrollment> findByCourseId(@Param("courseId") Long courseId);

    /**
     * Find completed enrollments for a student
     *
     * @param student The student
     * @return List of completed enrollments
     */
    List<Enrollment> findByStudentAndCompleted(User student, Boolean completed);

    /**
     * Find enrollments with progress greater than specified value
     *
     * @param student The student
     * @param progress The minimum progress value
     * @return List of enrollments with progress >= specified value
     */
    List<Enrollment> findByStudentAndProgressGreaterThanEqual(User student, Integer progress);

    /**
     * Count completed enrollments for a course
     *
     * @param course The course
     * @return Number of completed enrollments
     */
    Integer countByCourseAndCompleted(Course course, Boolean completed);
}